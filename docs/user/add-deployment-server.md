# Adding an OTP Deployment Server in TRANSIT-data-tools

Assumptions:

* [X] You are an admin for TRANSIT-data-tools.
* [X] You have [set up OTP UI and backend servers on AWS](./setting-up-aws-servers.md).
* [X] You have a private key file (usually ends in `.pem`) to connect to that AWS environment and EC2 servers via ssh.

From `Administration > Deployment servers`, click `+ Add Server`.

## General Server Properties

| Property | Description |
|----------|-------------|
| Name     | A descriptive display name for the server.        |
| Public URL | The URL where the public can access the TRANSIT-data-tools UI, e.g. `https://otp-mod-ui.ibi-transit.com`. It is typically the  CNAME of the CloudFront mirror of the AWS S3 bucket you created or picked for this deployment.         |
| Internal URLs (Optional) | The URL(s) based on the UI server IP address(es). |
| S3 bucket name | The name of the AWS S3 bucket you created or picked for this deployment, where TRANSIT-data-tools will share files with the OTP servers. |
| Admin access only? | Check this option to only allow logins from Data Tool admins. |
| Project specific? (Optional) | Select a project to only allow the GTFS feeds of that project (e.g. within a region) to be deployed to this server. Leave blank to remove the project restriction. |
|AWS Role|The IAM role that the TRANSIT-data-tools application must assume in order to access AWS resources (e.g., writing to S3 buckets or starting EC2 machines). See [Delegate Third Party Access](../setting-up-aws-servers#delegate-third-party-account-access) for more info.|
| Use elastic load balancer (ELB) | **We recommend using an elastic load balancer (ELB)**. Behind the scenes, a new server is initialized and added to the load balancer, and old servers are removed and destroyed without interruption to the user. <br><br>The load balancer also allows instantiating multiple OTP servers on large deployments. (You can start, add, or remove more than one OTP server to the load balancer.)

## Load Balancer Properties

(Applies to TRANSIT-data-tools versions prior to October 2019.)

| Property | Description |
|----------|-------------|
| Instance type (Optional) | The AWS server type (defines the size, CPU, memory) for all instances on the load balancer. Defaults to `t2.medium`. <br><br> For large deployments (e.g., large metro or statewide), you may need to scale up the instance type beyond the default. Information about instance type sizes and costs can be found at the helpful resource https://ec2instances.info or in the [AWS docs](https://aws.amazon.com/ec2/instance-types/). <br><br>**Note:** Some instance types are not available in certain regions or for VPC setups. If there is a failure during the deployment process (either due to an AWS system error or an out of memory error related to the OTP graph build process), you should be notified and may need to adjust the instance type.
| AMI ID (Optional) | Specify an AWS Machine Image (AMI) if it is not the default one. |
| Instance count | Specifies the number of servers to create under this load balancer. Defaults to 1. |
| Target group ARN | From the AWS Target Groups view (`EC2 > Left Pane > Load Balancing > Target Groups`), find the target group of the desired load balancer, and enter the ARN value under the `Description` tab. |
| Subnet ID (Optional) | The first portion of the first AWS availability zone, e.g. if the zone value is `subnet-0123456789 - us-east-xx`, only enter `subnet-0123456789`. <br><br>The AWS availability zone is found under the load balancer `Description` tab for the desired load balancer in the `AWS Load Balancer` view. |
| Security group ID (Optional) | The security group of the AWS load balancer that supports HTTP, HTTPS, and SSH, e.g. `sg-0123456789abcdef`. <br><br>The security group ID is found under the load balancer `Description` tab for the desired load balancer in the `AWS Load Balancer` view.|
| IAM instance profile ARN | From the `AWS IAM Dashboard > Roles`, pick a role to assign to the deployment servers. Open the role details in AWS to see the IAM instance profile ARN, , e.g. `arn:aws:iam::0123456789:instance-profile/example-role`. |
| Key file name | Enter a valid private key file name, without the `.pem` extension (copy value from another deployment server). |

If there are EC2 instances running for the desired load balancer, you can click `Terminate EC2 Instances` before proceeding.

Proceed to save the new deployment server (The `Save` button is at the top of the dialog). The new server will  appear in the list of available servers when deploying feeds.

## For test deployments (from old notes)

A flexible approach for test deployments is to create a stable EC2
instance with a good amount of memory. Identify one or more `internalUrls`
which is the URL where the OTP server is listening for a `buildGraphOverWire`
request. (Note: the `publicUrl` should point to a user interface
for the trip planner.)
