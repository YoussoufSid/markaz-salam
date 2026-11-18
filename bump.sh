#!/bin/sh
# usage: ./bump.sh  — يرفع رقم الإصدار في sw.js وindex.html معًا
n=$(grep -o 'salam-v[0-9]*' sw.js | head -1 | tr -dc 0-9); n=$((n+1))
sed -i "s/salam-v[0-9]*/salam-v$n/" sw.js
sed -i "s/^const BUILD=[0-9]*;/const BUILD=$n;/" index.html
echo "build $n"
