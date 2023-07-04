# Bus Ticketing System

A Node app serving as the backend service provider for the project.\
Provides bus ticketing facility using Server Sent Events (SSEs) for real time updates.\
Ideated as part of PR301 semester project at IIITDM Jabalpur

The system uses MongoDB as its primary data store and RedisLabs as a distributed cache store.\
The system facilitates:
1. User CRUD operations secured with email based **two factor auth**.
2. **Single device sign** in using **Redis cache** and token validation methods.
3. QR based Bus-session management, allowing fast and reliable verfication of passengers with **dynamically updating session codes**.
4. **Preference based** ticket booking using a home-grown **queueing system**.
5. **Live data** of bus seats remaining using Server Sent Events (SSEs).
6. In house **wallet system** for secure, reliable and fast transactions.


The application also features:
1. BOTH rest and socket implementations of ALL routes thus ensuring modularity and scope for further expansion.
2. adjustment to use SSEs or switch to web sockets with ease.
3. access to an admin account to manage and manipulate the server.
4. access to a GodAdmin that manages creation of conductor and developer accounts.
5. a maintainence switch that shuts down all API routes and also auto triggers when a fatal error occurs.


## High Level Design Diagram
The high level design of the system as of now is
![Curr HLD](https://github.com/AryanWadkar/BusTicketingSystem/assets/85237273/092e829e-cdac-49fa-8768-4ffb9739018a)

## Future Plans
This project is a work in progres, I plan to do a lot more with this project which includes things like:
1. Move to an SOA architecture
2. Switch to using web sockets to faciliate interactive features a live message feed, gamification possibilities etc.
3. Install a rate limiter to enhance security
4. Scale to multiple instance and use a NGINX load balancer to distribute traffic
5. Integrate event logging to obtain analytics
6. Use a Amazon S3 bucket as a datalake to perform periodic backups.
7. Use Kafka message queues to provide reliable SMTP service.

The proposed beta phase HLD Diagram is

![Proposed HLD](https://github.com/AryanWadkar/BusTicketingSystem/assets/85237273/1f6c4bb9-139a-4f21-9b68-26970ef7f3d3)
