@echo off

echo Running dev server...

cd src/client/
start "EndianClient" "client.bat"
cd /d %~dp0
cd src/server/
start "EndianServer" "server.bat"
cd /d %~dp0
cd src/simulation/
start "EndianSimulation" "simulation.bat"