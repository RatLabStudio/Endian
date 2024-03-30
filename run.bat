@echo off

echo Running dev server...

cd src/client/
start "" "client.bat"
cd /d %~dp0
cd src/server/
start "" "server.bat"
cd /d %~dp0
cd src/simulation/
start "" "simulation.bat"

start "" http://localhost:5173