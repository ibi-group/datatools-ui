# Localization

## Adding translations for a new language
To add support for a new language, you need to perform the following steps:

1. Create a new language file in folder `i18`, e.g. by copying the `english.yml`.
2. In the newly created `<new language>.yml`, adapt the first two lines: `_id` should conform to the ISO 639 language code, `_name` to the localized language name.
3. In `lib/common/util/config.js`, add the import of the new language file at the mark  `// Add additional language files here.` Mind to add an `// $FlowFixMe` hint before the new line to make the linter happy
4. Translate all messages in the `<new language>.yml` file. Note, that names surrounded by percent characters (`%`) denote parameters and must not be translated.
5. Add a new line to the CHANGELOG, e.g. `Add support for <new language>`.
5. Before commiting, run `yarn run lint-messages` or `yarn run test`.


## Internationalizing components
To internationalize components not yet translated, perform the following steps:

* For components not yet translated:
	* import getComponentMessages from common/util.config.
	* assign getComponentMessages('<ComponentName>') to a component properties `messages`
	* extract not yet translated messages from component files to `i18n/english.yml` and replace their original text by this.messages('<key>').
	* in case the original message contains dynamic parts, you should create placeholders (e.g. `%placeholder%`, and replacing that string with the intended value after calling `this.messages('<key>')`). Note that numeric parameters should be converted to strings.
* When done, add the new message keys to the existing translation files, e.g. using [yq](https://mikefarah.gitbook.io/yq/v/v2.x/), like e.g. `yq merge i18n/german.yml i18n/english.yml | sponge i18n/german.yml`. Note: Besides merging the missing keys, yq has some reformatting/reordering side effects, i.e. messages surrounded by brackets need to be quoted, otherwise they are converted to nested arrays.
* Periodically, and especially before commiting, run `yarn run lint-messages` or `yarn run test` to be sure all tests are still running. 

Note: console log messages are not intended to be localized

### Open issues
There are a few sections, which are not yet prepared for i18n and will not adapt to the user's locale:
* The alerts module (`lib/alerts/**`) is not yet fully internationalized.
* A couple of messages (i.e. job names and status) are generated server-side and are not internationalized yet.
* Time and date formatting performed by the moment javascript lib are not locale aware.
* Some messages from the react-bootstrap table component, e.g. `Showing row x-y of z`.
* GTFS-related field names and descriptions defined in GTFS.yml.

