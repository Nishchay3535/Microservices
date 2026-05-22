import pytest


@pytest.mark.asyncio
async def test_register_login(client):
    r = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "e1@test.com",
            "password": "password123",
            "full_name": "Employee One",
            "role": "employee",
        },
    )
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]
    assert token

    r2 = await client.post(
        "/api/v1/auth/login",
        json={"email": "e1@test.com", "password": "password123"},
    )
    assert r2.status_code == 200
    assert r2.json()["access_token"]

    me = await client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "e1@test.com"
