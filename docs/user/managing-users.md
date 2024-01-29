# Managing Users

## Overview

User accounts in the TRANSIT-data-tools suite are managed via Auth0, a third-party authentication service. (For details on setting up Auth0 for use with this application, please refer to the Deployment documentation.)

Auth0 allows for access via internally defined user accounts as well as third-party identity providers (e.g. social networking sites); however, this documentation only addresses internal accounts. Internal accounts employ username-password authentication, with a user's email address serving as the unique username.

## User Permissions

The TRANSIT-data-tools suite uses a system of user permissions to control access to various functions within the application.

### Admin users
Three types of administrator-level users exist:

- **Application-level administrator**: has full access to the TRANSIT-data-tools suite, including access to all projects and feed sources, the ability to create new projects, and the ability to create and manage users.
- **Organization-level administrator**: has full access to all projects and feed sources for an organization. **Note:** this user type is only for users of non-enterprise implementations (i.e., https://gtfs.ibi-transit.com).
- **Project-level administrator**: holds full access to a single project, including all project-level permissions. Is not able to create new projects or administer users.

### Non-admin users
For non-administrative users, permissions may be assigned on an individual basis by choosing `Custom`. A non-administrative user's permissions can also be set to only apply to particular feeds within a project. By default, all users with project access have read-only access for all project feeds.

#### User permissions examples
1. A user may need edit privileges to only one feed source. In this case, click `Edit GTFS feeds` and the specific feed (e.g., Agency X) would be checked.
2. Agencies may wish to grant access to users that can view basic reporting info, but should not have the ability to modify or manage anything in the application. Here, `Custom` should be selected, but no other permissions or feeds should be checked.

## Managing Users

To create or manage users, you must be logged in as either an application-level or organization-level administrator. To do so, navigate to the `Home` page and click the `Admin` button located in the top right-hand corner. This action will grant you access to the user management console, where you will find a comprehensive list of all users within the system:

<img src="https://datatools-builds.s3.amazonaws.com/docs/intro/user-admin.png" style="box-shadow: 3px 3px 3px gray; border-radius: 10px;">

Click `Edit` next to a user name to see an expanded user profile where specific permissions can be set:

<img src="https://datatools-builds.s3.amazonaws.com/docs/intro/user-profile.png" style="box-shadow: 3px 3px 3px gray; border-radius: 10px;">


To create a new user, click the `Create User` button:

<img src="https://datatools-builds.s3.amazonaws.com/docs/intro/create-user.png" style="box-shadow: 3px 3px 3px gray; border-radius: 10px;">

You will be asked to provide an email address (which serves as the user's username), an initial password for the user, and any initial permission settings. Once created, the user will receive a confirmation email at the specified email address.

## Password Reset
Have you forgotten your password or do you need to change it for any reason?  

### If Logged Out
While logged out, click the `Log In` button and then "Don't remember your password". After submitting the email address associated with your user account, an email will be sent to you containing a link to reset your password.
![pass-logged-out](https://datatools-builds.s3.amazonaws.com/docs/intro/password-reset-logged-out.png)

### If Logged In
Click the user icon at the bottom of the lefthand sidebar and click `Change Password` to submit your email address.
<img src="https://datatools-builds.s3.amazonaws.com/docs/intro/password-reset-logged-in.png" style="box-shadow: 3px 3px 3px gray; border-radius: 10px;">

**Note:** if you don't receive a password reset email within a few minutes, please check your spam/junk folder.
