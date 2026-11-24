# Notice

Version 1 of this repository (2021) closely followed the "Adding HTTPS support" and "Service 1 - Ping" lessons from **The Node.js Master Class** by Pirple:
<https://github.com/pirple/The-NodeJS-Master-Class>

A line comparison made in 2026 found that 65 of the 92 non-blank lines in that lesson's `index.js` also appear in the version 1 `index.js`.

Version 2 rewrites the implementation but keeps concepts from the course: one request pipeline shared by HTTP and HTTPS, a handler-and-router structure, per-environment port configuration, and the `sample` and `ping` routes.

The course repository did not publish a license when checked in November 2026. This project therefore declares `UNLICENSED` and grants no rights over course-derived material.
