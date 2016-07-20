# Seven Mile Creek Geodesign
Geodesign application used for Seven Mile Creek.

Version five of the application includes a major UI rewrite, using Calcite Maps as the base.

## URL query string options

* Include `debug` to enable right-clicking, e.g. <http://maps.umn.edu/geodesign/?debug>
* Include `noparcels` to disable parcel painting, e.g. <http://maps.umn.edu/geodesign/?noparcels>

Query strings checking doesn't look for full, proper parameter names, only the presence of the check string in the query string, so <http://maps.umn.edu/geodesign/?noparcelsdebug> would both enable right-clicking and disable parcel painting.
