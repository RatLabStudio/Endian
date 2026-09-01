# Endian Alpha To-do List

## Map Builder:
The map builder will be a seperate program that allows me to design game maps for the Endian engine without needing to hard-code them.
### Features:
- 3D interface to build maps with all constructs available for placement
- Placeable lighting and objects
- Snap placement for constructs to ensure everything lines up well
- The ability to save maps in the form of a JSON file and load them back into the map builder
### JSON Setup:
- name: name of map
- constructList:
    - id: "file name",
    - position: Vector3,
    - rotation: Vector3