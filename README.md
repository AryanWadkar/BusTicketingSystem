# Bus Ticketing System

A Node app serving as the backend service provider for the project.\
Provides bus ticketing facility using Server Sent Events (SSEs) for real time updates.\
Ideated as part of PR301 semester project at IIITDM Jabalpur

The system uses MongoDB as its primary data store and RedisLabs as a distributed cache store.\
The system facilitates:
1. User CRUD operations secured with email based **two factor auth**.
2. **Single device sign** in using **Redis cache** and token validation methods.
3. QR based Bus-session management, allowing fast and reliable verfication of passengers with **dynamically updating session codes**.
4. **Preference based** ticket booking using a **queueing system**.
5. **Live data** of bus seats remaining using Server Sent Events (SSEs).
6. In house **wallet system** for secure, reliable and fast transactions.


The application also features:
1. BOTH rest and socket implementations of ALL routes thus ensuring modularity and scope for further expansion.
2. adjustment to use SSEs or switch to web sockets with ease.
3. access to an admin account to manage and manipulate the server.
4. access to a GodAdmin that manages creation of conductor and developer accounts.
5. a maintainence switch that shuts down all API routes and also auto triggers when a fatal error occurs.


## High Level Design Diagrams
The high level design of the system as of now is
![Curr HLD](https://github.com/AryanWadkar/BusTicketingSystem/assets/85237273/092e829e-cdac-49fa-8768-4ffb9739018a)

This project is a work in progres, final proposed high level system design is as follows:
![Proposed HLD](https://github.com/AryanWadkar/BusTicketingSystem/assets/85237273/1f6c4bb9-139a-4f21-9b68-26970ef7f3d3)
