from fastapi import Depends, HTTPException, Header, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import uuid

from app.core.database import get_db
from app.core.security import decode_token

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
):
    from app.models.user import User

    user_id = decode_token(credentials.credentials)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = await db.get(User, uuid.UUID(user_id))
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def get_current_org(
    x_org_id: Optional[str] = Header(default=None),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.models.user import Organization, OrgMember

    if x_org_id:
        try:
            org_id = uuid.UUID(x_org_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid org ID")

        member = await db.execute(
            select(OrgMember).where(
                OrgMember.org_id == org_id,
                OrgMember.user_id == current_user.id,
            )
        )
        if not member.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="Not a member of this organization")

        org = await db.get(Organization, org_id)
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")
        return org

    # Default: return user's primary org (first they own/belong to)
    result = await db.execute(
        select(Organization)
        .join(OrgMember, OrgMember.org_id == Organization.id)
        .where(OrgMember.user_id == current_user.id)
        .order_by(OrgMember.joined_at)
        .limit(1)
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="No organization found. Please create one.")
    return org
