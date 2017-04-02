Rogue requires jquery and lodash. But it does not import via require or import directory. 
The reason is, jquery and lodash are very common packages and it is likely a client is using a
different version, which may cause conflict.

So I chose to inject all dependencies.

