# OTP Deployment Guide

## Overview

This guide describes how to configure and deploy OTP servers using OTP TRANSIT-data-tools, and is for intermediate to advanced OTP TRANSIT-data-tools administrators.


The following steps outline the process for performing an OTP deployment, covering the setup and linking of OTP servers to load balancers, S3 servers to CloudFront, and the integration of these various AWS resources within TRANSIT-data-tools. Administrators will also find instructions on how to configure optional subdomains (i.e., public URLs) for OTP servers.

## OTP Deployment Architecture

The deployment architecture diagram below depicts how OTP servers are managed by TRANSIT-data-tools and can be used with elastic load balancers. The user interface is deployed on Amazon S3 servers and optionally mirrored by CloudFront, a high-bandwidth content delivery mechanism. TRANSIT-data-tools prepares and sends a data bundle and configuration properties to initialize OTP servers. The data bundle includes a set of GTFS feeds and OpenStreetMap data. DataTools makes the request to the osm-lib server and then creates a bundle of the resulting OSM and GTFS data. TRANSIT-data-tools does not manage UI deployments at this time.

<img src="https://datatools-builds.s3.amazonaws.com/docs/otp/otp-deployment-diagram.png" style="box-shadow: 3px 3px 3px gray; border-radius: 10px;">

## Resources for Performing an OTP Deployment

1. [Setting up OTP UI and backend servers on AWS](./setting-up-aws-servers.md)
2. [Adding a deployment server from TRANSIT-data-tools](./add-deployment-server.md)
3. [Deploying GTFS feeds to OTP](./deploying-feeds.md)
