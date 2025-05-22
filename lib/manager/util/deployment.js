// @flow

import type {Deployment, EC2InstanceSummary, FormProps, Project} from '../../types'

const options = [
  {disabled: true, value: '', children: '[select value]'},
  {value: true, children: 'true'},
  {value: false, children: 'false'}]

export const FIELDS: Array<FormProps> = [
  {
    name: 'buildConfig.fetchElevationUS',
    componentClass: 'select',
    type: 'select-bool',
    children: options,
    effects: [
      {
        key: 'buildConfig.elevationBucket',
        value: {}
      }
    ]
  }, {
    name: 'buildConfig.stationTransfers',
    componentClass: 'select',
    type: 'select-bool',
    children: options
  }, {
    name: 'buildConfig.subwayAccessTime',
    type: 'number',
    placeholder: '2.5 (min)',
    width: 12
  }, {
    name: 'buildConfig.fares',
    placeholder: 'pdx',
    type: 'text',
    width: 12
  },
  // {
  //   name: 'routerConfig.driveDistanceReluctance',
  //   type: 'number',
  //   placeholder: '1.5'
  // }, {
  //   name: 'routerConfig.stairsReluctance',
  //   type: 'number',
  //   placeholder: '2.0'
  // },
  // {
  //   name: 'routerConfig.itineraryFilters.nonTransitGeneralizedCostLimit',
  //   type: 'text',
  //   placeholder: '0 + 1.0x'
  // },
  {
    name: 'routerConfig.requestLogFile',
    type: 'text',
    placeholder: '/var/otp/request.log',
    width: 12
  }
]

export const UPDATER_FIELDS: Array<FormProps> = [
  {
    name: 'routerConfig.updaters.$index.type',
    type: 'select',
    componentClass: 'select',
    children: [
      {disabled: true, value: '', children: '[select value]'},
      {value: 'real-time-alerts', children: 'real-time-alerts'},
      {value: 'stop-time-updater', children: 'stop-time-updater'},
      {value: 'vehicle-positions', children: 'vehicle-positions'},
      {value: 'vehicle-rental', children: 'vehicle-rental'},
      {value: 'bike-rental', children: 'bike-rental'},
      {value: 'bike-park', children: 'bike-park'},
      {value: 'websocket-gtfs-rt-updater', children: 'websocket-gtfs-rt-updater'},
      {value: 'example-updater', children: 'example-updater'},
      {value: 'example-polling-updater', children: 'example-polling-updater'},
      {value: 'winkki-polling-updater', children: 'winkki-polling-updater'},
      {value: 'opentraffic-updater', children: 'opentraffic-updater'}
    ],
    width: 12
  }, {
    name: 'routerConfig.updaters.$index.frequencySec',
    placeholder: '30',
    type: 'number',
    step: '1' // integer
  }, {
    name: 'routerConfig.updaters.$index.sourceType',
    placeholder: 'e.g., gbfs, bixi, city-bikes',
    type: 'select',
    componentClass: 'select',
    children: [
      {value: 'gtfs-http', children: 'gtfs-http'},
      {value: 'gbfs', children: 'gbfs'},
      {value: 'jcdecaux', children: 'jcdecaux'},
      {value: 'b-cycle', children: 'b-cycle'},
      {value: 'bixi', children: 'bixi'},
      {value: 'keolis-rennes', children: 'keolis-rennes'},
      {value: 'ov-fiets', children: 'ov-fiets'},
      {value: 'city-bikes', children: 'city-bikes'},
      {value: 'vcub', children: 'vcub'},
      {value: 'citi-bike-nyc', children: 'citi-bike-nyc'},
      {value: 'next-bike', children: 'next-bike'},
      {value: 'kml', children: 'kml'},
      {value: 'sf-bay-area', children: 'sf-bay-area'},
      {value: 'share-bike', children: 'share-bike'},
      {value: 'kml-placemarks', children: 'kml-placemarks'},
      {value: 'gtfs-file', children: 'gtfs-file'}
    ]
  }, {
    name: 'routerConfig.updaters.$index.url',
    placeholder: 'https://agency.com/realtime/tripupdates',
    type: 'text'
  }, {
    name: 'routerConfig.updaters.$index.feedId',
    placeholder: '[optional]',
    type: 'text'
  }
]

export const SERVER_FIELDS: Array<FormProps> = [
  {
    name: 'otpServers.$index.name',
    placeholder: 'Production',
    type: 'text',
    width: 12
  }, {
    name: 'otpServers.$index.publicUrl',
    placeholder: 'http://otp.example.com',
    type: 'text'
  }, {
    name: 'otpServers.$index.internalUrl',
    placeholder: 'http://127.0.0.1/otp,http://0.0.0.0/otp',
    split: true,
    type: 'text'
  }, {
    name: 'otpServers.$index.s3Bucket',
    placeholder: 's3_bucket_name',
    type: 'text',
    width: 4
  }, {
    name: 'otpServers.$index.admin',
    type: 'checkbox',
    width: 4
  }, {
    name: 'otpServers.$index.role',
    placeholder: 'AWS ARN for role to assume',
    type: 'text',
    width: 4
  }
]

export const EC2_INFO_FIELDS: Array<FormProps> = [
  {
    name: 'otpServers.$index.ec2Info.region',
    placeholder: 'defaults to datatools region',
    type: 'text',
    width: 12
  }, {
    name: 'otpServers.$index.ec2Info.instanceType',
    placeholder: 't2.medium',
    type: 'text',
    width: 12
  }, {
    name: 'otpServers.$index.ec2Info.amiId',
    placeholder: 'defaults to system OTP AMI',
    type: 'text',
    width: 12
  }, {
    name: 'otpServers.$index.ec2Info.buildInstanceType',
    placeholder: 't2.medium',
    type: 'text',
    width: 12
  }, {
    name: 'otpServers.$index.ec2Info.buildAmiId',
    placeholder: 'defaults to system OTP AMI',
    type: 'text',
    width: 12
  }, {
    name: 'otpServers.$index.ec2Info.recreateBuildImage',
    type: 'checkbox',
    width: 12
  }, {
    name: 'otpServers.$index.ec2Info.buildImageName',
    placeholder: 'New AMI name',
    type: 'text',
    width: 12
  }, {
    name: 'otpServers.$index.ec2Info.buildImageDescription',
    placeholder: 'New AMI description',
    type: 'text',
    width: 12
  }, {
    max: 3, // set max # of servers to 3 in UI to prevent something crazy happening.
    min: 1,
    name: 'otpServers.$index.ec2Info.instanceCount',
    placeholder: 'defaults to 1',
    step: '1', // integer
    type: 'number',
    width: 12
  }, {
    name: 'otpServers.$index.ec2Info.targetGroupArn',
    placeholder: 'arn:aws:elasticloadbalancing:us-east-1:12345678:targetgroup/target-group-name/12345678abcd',
    required: true,
    type: 'text',
    width: 12
  }, {
    name: 'otpServers.$index.ec2Info.subnetId',
    placeholder: 'e.g., subnet-1abcdef (defaults to ELB value)',
    type: 'text',
    width: 12
  }, {
    name: 'otpServers.$index.ec2Info.securityGroupId',
    placeholder: 'e.g., sg-1abcdef1ghijkl (defaults to ELB value)',
    type: 'text',
    width: 12
  }, {
    name: 'otpServers.$index.ec2Info.iamInstanceProfileArn',
    placeholder: 'arn:aws:iam::123456789012:instance-profile/$ROLE_NAME',
    required: true,
    type: 'text',
    width: 12
  }, {
    name: 'otpServers.$index.ec2Info.keyName',
    placeholder: 'key-name (without .pem)',
    required: true,
    type: 'text',
    width: 12
  }
]

export function getServerDeployedTo (deployment: Deployment, project: Project) {
  return deployment.deployedTo
    ? getServerForId(deployment.deployedTo, project)
    : null
}

export function getServerForId (serverId: ?string, project: Project) {
  if (!serverId || !project.otpServers) return null
  return project.otpServers.find(server => server.id === serverId)
}

export function getActiveInstanceCount (instances?: Array<EC2InstanceSummary>) {
  return instances
    ? instances.filter(instance => instance.state.name === 'running').length
    : 0
}

/**
 * Sort function for list of deployments.
 */
export function deploymentsComparator (a: Deployment, b: Deployment, pinnedDeploymentId: ?string) {
  // If creating deployment, pin to top.
  if (!a.name) return -1
  if (!b.name) return 1
  // Ensure pinned deployment is first element in list.
  if (b.id === pinnedDeploymentId) return 1
  if (a.id === pinnedDeploymentId) return -1
  // Otherwise, sort by most recent last deployed date and then most recent
  // created date (ensuring deployments never deployed show up at end of
  // list).
  // TODO: Refactor to allow for sorting on multiple fields? This may be
  //  overkill for deployments.
  const aValue = a.lastDeployed || a.dateCreated
  const bValue = b.lastDeployed || b.dateCreated
  if (b.lastDeployed && !a.lastDeployed) return 1
  else if (a.lastDeployed && !b.lastDeployed) return -1
  return bValue - aValue
}
