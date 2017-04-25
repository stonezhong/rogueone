#!/bin/sh

mkdir -p build
rm build/* -rf

babel src --out-dir build
