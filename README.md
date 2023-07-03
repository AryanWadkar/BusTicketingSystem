# Bus Ticketing System

A Node app serving as the backend service provider for the project.\
Provides bus ticketing facility using web sockets for real time updates.\
Ideated as part of PR301 semester project at IIITD Jabalpur

The system uses MongoDB as its primary data store and RedisLabs as a distributed cache store.\
The system facilitates:
1. User CRUD operations secured with email based **two factor auth**.
2. **Web Socket** based events for ticket booking, viewing transactions, bookings, and verifying tickets.
3. **Single device sign** in using **Redis cache** and token validation methods.
4. Socket based bus-session management, allowing fast and reliable verfication of passengers with **dynamically updating session codes**.
5. **Preference based** ticket booking using a **queueing system**.
6. **Live data** of bus seats remaining using web sockets.
7. In house **wallet system** for secure, reliable and fast transactions.

## High Level Design Diagrams
The high level design of the system as of now is
![Untitled Diagram (2) drawio](https://github.com/AryanWadkar/BusTicketingSystem/assets/85237273/4a763a7c-8db8-43be-b10e-6c7a8aeb4704)\

This project is a work in progres, final proposed high level system design is as follows:
![Untitled Diagram drawio (3)](https://github.com/AryanWadkar/BusTicketingSystem/assets/85237273/dface952-2561-4c34-bec5-ad0795a400cb)

