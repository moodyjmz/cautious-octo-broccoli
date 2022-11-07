we have a web page

it provides assets

these assets have a timestamp to cache bust

the assets are often made within ms of each other, leading to different timestamps

the assets with different timestamps may be the same, or not

we should:

we look up the timestamp we have and see if another is returned

timeStampMap

map.get(x)

we replace the initial one with this

if we do not:

we will fetch the file required

hash it, and check against our known hashes

this might return a timestamp, if so, we use that and also map this

hashMap

map {hash, timestamp}

we then add this returned timestamp to the timeStampMap

if this also doesn't work:

we add this new hash to the hashmap and associate the timestamp

we make an array of the files in the document and associate their elements

1) get the scripts and css references as elements

2) iterate the elements

3) in the iteration perform the lookup as above, changing the timestamp as needed

4) serialise the html and return it




