# Endian Alpha To-do List

## Next Update (5.2.0):
- Finish Simulation migration
    - Re-implement shooting
- Make the CPU display receive updates by the row, like how it updates
    - The reason for this is that the CPU display is causing a bottleneck 
        of commands through the socket.io server; which means that the 
        whole game is lagging when the CPU display is updated all at once.
- Add more input types to the settings menu to replace the boolean sliders
- Work on Voxel Objects
- Fix some players not receiving death messages in chat
- Add damage indicators for all players
- Add lighting and particle trail for bullets
- Fix the player join messages