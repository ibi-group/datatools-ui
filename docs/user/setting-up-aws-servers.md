# Setting Up OTP Deployment Servers on Amazon Web Services (AWS)

This document describes how to:

1. [Create an OTP UI server (AWS S3 and CloudFront)](#ui-server-s3-bucket-and-cloudfront)
2. [Create an OTP backend load balancer (AWS EC2)](#backend-server-load-balancer)
3. [Delegate access to TRANSIT-data-tools for resources in a third party AWS account via an IAM role](#delegate-third-party-account-access)

Assumptions for IBI-hosted deployments:

1. You are logged into an IBI Group AWS environment.
2. You have selected a region (e.g. [US East (N. Virginia)](https://console.aws.amazon.com/console/home?region=us-east-1)).
3. A Virtual Private Cloud (VPC) with two subnets exists in that AWS environment.

## Create an OTP UI server (AWS S3 and CloudFront)

The OTP user interface is delivered using a plain HTTP file server that does not perform any computations. The file server consists of one S3 bucket. For fast high-bandwidth file delivery, we mirror the S3 bucket using CloudFront.

### Create an S3 Bucket

1. From [AWS S3](https://console.aws.amazon.com/s3/home), click `Create Bucket`. Each deployment uses its own bucket.
2. Specify a name (write down the name for use in TRANSIT-data-tools later).
3. When specifying options, uncheck `Block All Public Access`.
Do not grant additional access from the bucket's `Permissions` tab. 

### Create a CloudFront instance

1. From [AWS CloudFront Home](https://console.aws.amazon.com/cloudfront/home), click `Create Distribution` [(direct link)](https://console.aws.amazon.com/cloudfront/home?#create-distribution:).
2. Click `Web Distribution`, then click `Next`.
3. Under `Origin Settings > Origin Domain Name`, click the `DNS name` of the S3 bucket you created above.
4. Under `Default Cache Behavior Settings`:
   1. Click `Redirect HTTP to HTTPS`.
   2. Click `Yes` to `Compress Objects Automatically` (this reduces download sizes by up to 60-70%).   
5. Under `Distribution Settings`, click `Custom SSL certificate`, and click the `*.ibi-transit.com` certificate.
6. Under `Distribution Settings`, set the `Default Root Object` value to be `index.html`.
7. (Optional) Enter a comment to make the distribution easy to search. Leave other parameters as is, and click `Create Distribution`.
8. Open the properties of this CloudFront instance, and copy the `Domain Name` value (e.g. `abcdef0123456789.cloudfront.net`).

### Create a CNAME (i.e. subdomain) for CloudFront

1. Go to the [AWS hosted zone for ibi-transit.com](https://console.aws.amazon.com/route53/home#resource-record-sets:Z37ATQUY9Y96RY).  
   (It should be under [AWS Route 53](https://console.aws.amazon.com/route53/home), [Hosted Zones](https://console.aws.amazon.com/route53/home#hosted-zones:).)
2. Click `Create Record Set`. Fill in the subdmain (e.g. `otp-mod-ui.ibi-transit.com`). The OTP UI will be available at this URL. Set the `Record Type` to `CNAME`.
3. In the value field, paste the `Domain Name` value of the CloudFront instance above.
4. Click `Create`.
5. Return to [AWS CloudFront Home](https://console.aws.amazon.com/cloudfront/home).
6. Edit the properties of the CloudFront instance you created:
   * In `Alternate Domain Names (CNAMEs)`, paste the CNAME created above.

### Upload files for OTP UI

Upload the files [referenced here](https://github.com/ibi-group/trimet-mod-otp#to-build-a-production-bundle-for-deployment) to the S3 bucket created above.

If updating the UI files, remember to invalidate the CloudFront instance (this forces an update of the files on CloudFront).

## Create an OTP backend load balancer (AWS EC2)


We recommend using an elastic load balancer (ELB) to deploy or upgrade an OTP server instance without interrupting the current one. This involves setting up a new server in the background. Once it's ready (after preprocessing is complete), the new server is added to the load balancer, and the old server is removed and destroyed.

The load balancer also allows instantiating multiple OTP servers on large deployments. (You can start, add, or remove more than one OTP server to the load balancer.)

### Create the load balancer in AWS

1. Go to [Create Application Load Balancer](https://console.aws.amazon.com/ec2/home#V2CreateELBWizard:type=application:)  
   (Under [AWS EC2 Load Balancers view](https://console.aws.amazon.com/ec2/home#LoadBalancers:), click `Create Load Balancer` then `Application Load Balancer`.)
2. Enter a name, add a listener for HTTPS (443), pick a VPC with two subnets/availability zones available, and click two of the subnets. (Leave other params as is, the HTTP(80) listener should be there by default). Click `Next`.
3. Choose a certificate in ACM, pick the IBI Group certificate. (Leave other params as is). Click `Next`.
4. Create a new security group, or use an existing one that supports HTTP, HTTPS, SSH. (Leave other params as is). Click `Next`.
5. Create a new target group (pick a name). Click `Next`.
6.  Do not register any targets. Click `Finish`.
7.  From the [Load Balancer view](https://console.aws.amazon.com/ec2/home?#LoadBalancers:), click the row corresponding to your new load balancer.
8.  Under the `Listeners` tab, there should be two listeners, one for HTTP and one for HTTPS. Add the HTTPS listener if it is not there.
9.  Open the load balancer properties, and, under the `Description` tab, copy the load balancer's `DNS name` (e.g. `ibi-dev-otp-1234567890.us-east-1.elb.amazonaws.com`).

### Create a CNAME (i.e. subdomain) for the load balancer

1. Go to the [AWS hosted zone for ibi-transit.com](https://console.aws.amazon.com/route53/home#resource-record-sets:Z37ATQUY9Y96RY).\
   (It should be under [AWS Route 53](https://console.aws.amazon.com/route53/home), [Hosted Zones](https://console.aws.amazon.com/route53/home#hosted-zones:).)
2. Click `Create Record Set`. Fill in the subdmain (e.g. `otp-mod-dev.ibi-transit.com`). Set the `Record Type` to `CNAME`.
3. In the value field, paste the `DNS Name` of the load balancer instance above.
4. Click `Create`.

## Delegate access to TRANSIT-data-tools for resources in a third party AWS account via an IAM role
For TRANSIT-data-tools to access AWS resources (e.g., S3 and EC2) in third party AWS accounts, additional setup is required. The steps provided in [this AWS tutorial](https://docs.aws.amazon.com/IAM/latest/UserGuide/tutorial_cross-account-with-roles.html) detail the process to delegate access across AWS accounts. A more tailored, shorthand version of this process is provided below, but if more background information is needed about, please follow the tutorial link above.

### Steps to Give TRANSIT-data-tools Access to Third Party Account
1. Log into third party (i.e., other organization's) AWS account.
2. Open the [Roles view](https://console.aws.amazon.com/iam/home#/roles) in the IAM dashboard and create a new role for `Another AWS Account` ([direct link](https://console.aws.amazon.com/iam/home#/roles$new?step=type&roleType=crossAccount)).
3. Enter an Arcadis/IBI Group account ID (or whichever account TRANSIT-data-tools is running in) and click `Next: Permissions`. Note: the additional security options (e.g., MFA) can be left unchecked.
4. Click the appropriate permissions needed by TRANSIT-data-tools for OTP deployment ([see below](#sample-permissions-for-third-party-aws-role) for full sample JSON). These should include:
 - read/write/list permissions to any S3 buckets needed,
 - full permissions to EC2, and
 - IAM permissions in order to read and pass IAM roles to EC2 instances.
5. Finish creating the role.
6. Log out of the third party account and into the IBI Group account.
7. Find the role under which the TRANSIT-data-tools application is running and add the following permission to allow TRANSIT-data-tools to assume the new role (be sure to replace the full ARN with your new role ARN, including the third party account ID):

        {
          "Version": "2012-10-17",
          "Statement": {
            "Effect": "Allow",
            "Action": "sts:AssumeRole",
            "Resource": "arn:aws:iam::123456789012:role/your-role-name"
          }
        }
8. You should be ready to deploy OTP servers in the third party AWS account!

### Sample Permissions for Third Party AWS Role
A sample JSON string with the permissions needed for the role created in the third party account is reproduced below. Note: this is also the base default permissions needed by any TRANSIT-data-tools instance application running on AWS.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ListObjectsInBucket",
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": ["arn:aws:s3:::your-bucket"]
    },
    {
      "Sid": "AllObjectActions",
      "Effect": "Allow",
      "Action": "s3:*Object",
      "Resource": ["arn:aws:s3:::your-bucket/*"]
    },
    {
      "Action": "ec2:*",
      "Effect": "Allow",
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": "elasticloadbalancing:*",
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:Get*",
        "iam:List*",
        "iam:PassRole"
      ],
      "Resource": "*"
    }
  ]
}
```
