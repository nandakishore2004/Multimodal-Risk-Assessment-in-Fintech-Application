# *తెలుగు* &mdash; Telugu (`te`)

This datasheet is for cv-corpus-26.0-2026-06-12 of the Mozilla Common Voice *Scripted Speech* dataset for Telugu [తెలుగు - `te`]. The dataset contains 2598 clips representing 3.04 hours of recorded speech (0.87 hours validated) from 67 speakers, recorded from a text corpus of 20,072 sentences.

## Language

### Accents

| Code | Accent | Clips | Speakers |
|---|---|---|---|
| - |  | 1,492 (57.4%) | 16 (23.9%) |

## Demographic information

The dataset includes the following self-declared age and gender distributions. A coverage summary is shown below each table.

### Gender

Self-declared gender information. The table shows clip and speaker counts with percentages. Speakers who did not declare a gender are listed as Unspecified. A dash (-) indicates zero.

| Code | Gender | Clips | Speakers |
|---|---|---|---|
| male_masculine | Male, masculine | 1,628 (62.7%) | 21 (31.3%) |
| female_feminine | Female, feminine | 467 (18.0%) | 8 (11.9%) |
| transgender | Transgender | - | - |
| non-binary | Non-binary | - | - |
| do_not_wish_to_say | Prefer not to say | - | - |
| - | Unspecified | 503 (19.4%) | 40 (59.7%) |

*Gender declared: 2,095 of 2,598 clips (80.6%), 27 of 67 speakers (40.3%)*

### Age

Self-declared age information. The table shows clip and speaker counts with percentages. Speakers who did not declare an age are listed as Unspecified. A dash (-) indicates zero.

| Code | Age | Clips | Speakers |
|---|---|---|---|
| teens | Teens | 169 (6.5%) | 5 (7.5%) |
| twenties | Twenties | 1,744 (67.1%) | 21 (31.3%) |
| thirties | Thirties | 110 (4.2%) | 4 (6.0%) |
| fourties | Fourties | 30 (1.2%) | 2 (3.0%) |
| fifties | Fifties | 27 (1.0%) | 1 (1.5%) |
| sixties | Sixties | 181 (7.0%) | 1 (1.5%) |
| seventies | Seventies | - | - |
| eighties | Eighties | - | - |
| nineties | Nineties | - | - |
| - | Unspecified | 337 (13.0%) | 35 (52.2%) |

*Age declared: 2,261 of 2,598 clips (87.0%), 32 of 67 speakers (47.8%)*

## Data splits for modelling

**Clip buckets**

| Bucket | Clips |
|---|---|
| Validated | 749 (28.8%) |
| Invalidated | 217 (8.4%) |
| Other | 1,632 (62.8%) |

**Training splits**

| Split | Clips |
|---|---|
| Train | 99 (13.2%) |
| Dev | 95 (12.7%) |
| Test | 93 (12.4%) |

*Training split coverage: 287 of 749 validated clips (38.3%)*

The dataset contains 749 validated, 217 invalidated, and 1632 unresolved clips. The average clip duration is 4.226 seconds.

## Text corpus

**Validated sentences:** 370

| Category | Count |
|---|---|
| Unvalidated sentences | 19,702 |
| Pending sentences | 19,618 |
| Rejected sentences | 84 |
| Reported sentences | 29 |

The corpus contains 20,072 sentences: 370 validated and 19,702 unvalidated (19,618 pending review, 84 rejected), with 29 reported for review.

### Sample

There follows a randomly selected sample of five sentences from the corpus.

1. *రాక్షసవీరులను మర్దించుటలో నింద్రునకు సహాయభూతు రాలు*
2. *సతుల సీత*
3. *సింహమును శశంబు సంహరించె*
4. *విఘ్నములు సంభవిస్తాయన్న భయముతో  అధములు కార్యములు ఆరంభించరు*
5. *నమ్రులను రక్షించుటకు నిపుణురాలవైన నీ చరణమును నేను శరణు బొందుచుంటిని*

### Sources

| Source | Sentences |
|---|---|
| sentence-collector | 252 (68.1%) |
| https://te.wikisource.org/wiki/?????:??????? | 111 (30.0%) |
| Other | 7 (1.9%) |

### Text domains

| Code | Domain | Clips | Speakers |
|---|---|---|---|
| general | General | - | - |
| agriculture_food | Agriculture and Food | - | - |
| automotive_transport | Automotive and Transport | - | - |
| finance | Finance | - | - |
| service_retail | Service and Retail | - | - |
| healthcare | Healthcare | 1 (0.0%) | 1 (1.5%) |
| history_law_government | History, Law and Government | - | - |
| media_entertainment | Media and Entertainment | - | - |
| nature_environment | Nature and Environment | - | - |
| news_current_affairs | News and Current Affairs | - | - |
| technology_robotics | Technology and Robotics | - | - |
| language_fundamentals | Language Fundamentals | 2 (0.1%) | 2 (3.0%) |

### Fields

#### Clips

Each row of a `tsv` file represents a single audio clip, and contains the following information:

- `client_id` - hashed UUID of a given user
- `path` - relative path of the audio file
- `sentence` - the sentence to be read aloud
- `sentence_id` - unique identifier for the sentence
- `sentence_domain` - domain classification(s) of the sentence
- `up_votes` - number of people who said audio matches the text
- `down_votes` - number of people who said audio does not match text
- `age` - age of the speaker[^1]
- `gender` - gender of the speaker[^1]
- `accents` - accents of the speaker[^1]
- `variant` - variant of the language[^1]
- `locale` - locale code of the language
- `segment` - if sentence belongs to a custom dataset segment, it will be listed here

[^1]: For a full list of age, gender, and accent options, see the [demographics spec](https://github.com/common-voice/common-voice/blob/main/web/src/stores/demographics.ts). These will only be reported if the speaker opted in to provide that information.

#### `validated_sentences.tsv`

The `validated_sentences.tsv` file contains one row per validated sentence in the text corpus:

- `sentence_id` - unique identifier for the sentence
- `sentence` - the sentence text
- `variant` - the variant of the language
- `sentence_domain` - the domain(s) the sentence belongs to
- `source` - the source the sentence was collected from
- `is_used` - whether the sentence is still in circulation for recording
- `clips_count` - number of clips recorded for this sentence

#### `unvalidated_sentences.tsv`

The `unvalidated_sentences.tsv` file contains one row per unvalidated sentence in the text corpus:

- `sentence_id` - unique identifier for the sentence
- `sentence` - the sentence text
- `variant` - the variant of the language
- `sentence_domain` - the domain(s) the sentence belongs to
- `source` - the source the sentence was collected from
- `up_votes` - number of upvotes the sentence received
- `down_votes` - number of downvotes the sentence received
- `status` - current status of the sentence (`pending` or `rejected`)

## Get involved

### Community links

- [Common Voice translators on Pontoon](https://pontoon.mozilla.org/te/common-voice/contributors/)
- [Common Voice Communities](https://github.com/common-voice/common-voice/blob/main/docs/COMMUNITIES.md)

### Discussions

- [Common Voice on Matrix](https://chat.mozilla.org/#/room/#common-voice:mozilla.org)
- [Common Voice on Discourse](https://discourse.mozilla.org/t/about-common-voice-readme-first/17218)
- [Common Voice on Discord](https://discord.gg/9QTj9zwn)
- [Common Voice on Telegram](https://t.me/mozilla_common_voice)

### Contribute

- [Speak](https://commonvoice.mozilla.org/te/speak)
- [Write](https://commonvoice.mozilla.org/te/write)
- [Listen](https://commonvoice.mozilla.org/te/listen)
- [Review](https://commonvoice.mozilla.org/te/review)

## Licence

This dataset is released under the [Creative Commons Zero (CC-0)](https://creativecommons.org/public-domain/cc0/) licence. By downloading this data you agree to not determine the identity of speakers in the dataset.
