from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid

from app.core.database import get_db
from app.core.deps import get_current_user, get_current_org
from app.models.user import Organization, OrgMember, OrgRole, User
from app.schemas.auth import OrgOut, OrgMemberOut, InviteRequest

router = APIRouter()


@router.get("/", response_model=List[OrgOut])
async def list_orgs(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Organization)
        .join(OrgMember, OrgMember.org_id == Organization.id)
        .where(OrgMember.user_id == current_user.id)
        .order_by(OrgMember.joined_at)
    )
    return result.scalars().all()


@router.get("/{org_id}/members", response_model=List[OrgMemberOut])
async def list_members(
    org_id: uuid.UUID,
    current_org=Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    if current_org.id != org_id:
        raise HTTPException(status_code=403, detail="Access denied")
    result = await db.execute(
        select(OrgMember).where(OrgMember.org_id == org_id)
    )
    return result.scalars().all()


@router.post("/{org_id}/members/invite", response_model=OrgMemberOut, status_code=status.HTTP_201_CREATED)
async def invite_member(
    org_id: uuid.UUID,
    data: InviteRequest,
    current_user=Depends(get_current_user),
    current_org=Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    if current_org.id != org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Verify caller is owner/admin
    caller_member = (await db.execute(
        select(OrgMember).where(OrgMember.org_id == org_id, OrgMember.user_id == current_user.id)
    )).scalar_one_or_none()
    if not caller_member or caller_member.role not in (OrgRole.OWNER, OrgRole.ADMIN):
        raise HTTPException(status_code=403, detail="Only owners and admins can invite members")

    user = (await db.execute(select(User).where(User.email == data.email))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found — they must register first")

    existing = (await db.execute(
        select(OrgMember).where(OrgMember.org_id == org_id, OrgMember.user_id == user.id)
    )).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="User is already a member")

    role = OrgRole(data.role) if data.role in OrgRole._value2member_map_ else OrgRole.MEMBER
    member = OrgMember(org_id=org_id, user_id=user.id, role=role)
    db.add(member)
    await db.flush()
    await db.refresh(member)
    return member


@router.delete("/{org_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    org_id: uuid.UUID,
    user_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    caller_member = (await db.execute(
        select(OrgMember).where(OrgMember.org_id == org_id, OrgMember.user_id == current_user.id)
    )).scalar_one_or_none()
    if not caller_member or caller_member.role not in (OrgRole.OWNER, OrgRole.ADMIN):
        raise HTTPException(status_code=403, detail="Only owners and admins can remove members")
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself")

    target = (await db.execute(
        select(OrgMember).where(OrgMember.org_id == org_id, OrgMember.user_id == user_id)
    )).scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="Member not found")
    await db.delete(target)
