Description:
Implement a logout functionality

User story:   

As a user i should be able to logout my account

Instruction:
I have already implemented the logout ui or link , The api reponsible for user logout is already implemented too i want you to create a frontend composable call useLogout.ts it should contain the frontend logout request to the nuxt server and use the composable in the place where the logout link is .


Bug 1:

The logout route is not triggered in the backend but the frontend is triggered and on cookie is deleted and the other one is not deleted  here is the cookie not deleted focusflow-user-auth-service-session => eyJpdiI6ImROOTlTS0ZyMGRRZzc3RUo1RFk2b2c9PSIsInZhbHVlIjoiU2hsVFBIVVJsa05BZDN0bmNBYk5CTFlLNXZZK3EyUENDNVFheU1oUHJvcjgvTGFHQldzOFJqVU9HS05oeVg1RXBZUGwxbnkxdEJreGhML2xueFVZVEwvU0RvRzl0akd4RE9qVFhDeFJEL1ZJVDhxRURKYTdPS1hleEMwL3lBdGQiLCJtYWMiOiI0ZmEyNWNlYjk5OTg2Y2ZmMGJkMWI3NTQ5MTU2ZWJjODA0MjU2MGY4MmViYTllZTBjZWI5MDZkOGE0Zjk3NGJlIiwidGFnIjoiIn0%3D

This  only when a user login with google the logout  but with normal login everything works well 