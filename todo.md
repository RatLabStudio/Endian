# Endian Alpha To-do List

## Next Update (5.1.6):
Endian CPU:
- Make it so that the server only checks for changed rows of pixels and send those, rather than the whole screen every time.
    - This will improve performance and responsiveness of the monitor, because I can set it to start updating the new rows first every time; so there will be less latency due to waiting for every row to update.