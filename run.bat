@echo off

echo Running dev server...

cd src/client/
start /B "" "client.bat"
cd /d %~dp0
cd src/server/
start /B "" "server.bat"
cd /d %~dp0
cd src/simulation/
start /B "" "simulation.bat"