// @flow

import { useState } from 'react';
import Select from 'react-select';
import Button from 'app/components/Button';
import Flex from 'app/components/Layout/Flex';
import { ConfirmModalWithParent } from 'app/components/Modal/ConfirmModal';
import type { PhotoConsent } from 'app/models';
import moment from 'moment-timezone';
import { PHOTO_CONSENT_DOMAINS, getConsent } from '../../events/utils';
import styles from './PhotoConsent.css';

const getYear = (semesterStr: string): number =>
  parseInt(semesterStr.substr(1, 2));

const getSemester = (semesterStr: string): string => semesterStr.charAt(0);

const ConsentManager = ({
  consent,
  updateConsent,
  isMe,
}: {
  consent: ?PhotoConsent,
  updateConsent: (consent: PhotoConsent) => Promise<*>,
  isMe: boolean,
}) => {
  if (!consent) {
    return null;
  }
  const convertToReadableSemester = (semesterYear: string): string =>
    (getSemester(semesterYear) === 'H' ? 'høsten 20' : 'våren 20') +
    getYear(semesterYear);

  const getConsentStatus = () => {
    if (consent?.isConsenting) {
      return (
        <>
          <b>Du ga samtykket den </b>
          <i>{moment(consent?.updatedAt).format('DD. MMM YYYY')}.</i>
        </>
      );
    } else if (consent?.isConsenting === false) {
      return (
        <>
          <b>Du trakk samtykket den </b>
          <i>{moment(consent?.updatedAt).format('DD. MMM YYYY')}.</i>
        </>
      );
    }
    return <b>Du har ikke tatt stilling til samtykket.</b>;
  };

  const presentableDomain =
    consent.domain === PHOTO_CONSENT_DOMAINS.WEBSITE
      ? 'abakus.no'
      : 'sosiale medier';
  return (
    <>
      <h4 className={styles.categoryTitle}>{presentableDomain}</h4>
      <h5>
        Jeg godtar at Abakus kan legge ut bilder av meg på {presentableDomain} i
        perioden {convertToReadableSemester(consent.semester)}:
      </h5>
      <div className={styles.statusContainer}>{getConsentStatus()}</div>
      <div>
        <ConfirmModalWithParent
          closeOnConfirm={true}
          title={`Trekke bildesamtykke på ${presentableDomain}`}
          message={`Er du sikker på at du vil trekke bildesamtykket ditt for ${convertToReadableSemester(
            consent.semester
          )} på ${presentableDomain}? Dersom du ønsker å fjerne noen spesifikke bilder, kan du i stedet sende en mail til pr@abakus.no med informasjon om hvilke bilder du vil fjerne.`}
          onConfirm={() => updateConsent({ ...consent, isConsenting: false })}
        >
          <Button
            className={styles.notConsentBtn}
            disabled={consent?.isConsenting === false || !isMe}
          >
            {consent?.isConsenting === null
              ? 'Nei'
              : !consent?.isConsenting
              ? 'Du har trukket samtykket'
              : 'Trekk samtykket'}
          </Button>
        </ConfirmModalWithParent>
        {consent?.isConsenting === null && (
          <Button
            disabled={!isMe}
            onClick={() => updateConsent({ ...consent, isConsenting: true })}
            className={styles.consentBtn}
          >
            Ja
          </Button>
        )}
      </div>
    </>
  );
};

const PhotoConsents = ({
  photoConsents,
  username,
  updatePhotoConsent,
  userId,
  isMe,
}: {
  photoConsents: Array<PhotoConsent>,
  username: string,
  updatePhotoConsent: (
    PhotoConsent: PhotoConsent,
    username: string,
    userId: Number
  ) => Promise<*>,
  userId: Number,
  isMe: boolean,
}) => {
  const semesters = [
    ...new Set(photoConsents.map((c) => c.semester)),
  ].sort((a, b) =>
    getYear(b) === getYear(a)
      ? parseInt(getSemester(b)) - parseInt(getSemester(a))
      : getYear(b) - getYear(a)
  );
  const [selectedSemester, setSelectedSemester] = useState(semesters[0]);

  const updateConsent = (consent: PhotoConsent) =>
    updatePhotoConsent(consent, username, userId);

  return (
    <Flex column={true}>
      <label htmlFor="select-semester">
        <h3>Semester</h3>
      </label>
      <Select
        name="select-semester"
        clearable={false}
        options={semesters.map((semester) => ({
          value: semester,
          label: semester,
        }))}
        value={{
          value: selectedSemester,
          label: selectedSemester,
        }}
        onChange={({ value }) => setSelectedSemester(value)}
      />
      <ConsentManager
        consent={getConsent(
          PHOTO_CONSENT_DOMAINS.SOCIAL_MEDIA,
          selectedSemester,
          photoConsents
        )}
        updateConsent={updateConsent}
        isMe={isMe}
      />
      <ConsentManager
        consent={getConsent(
          PHOTO_CONSENT_DOMAINS.WEBSITE,
          selectedSemester,
          photoConsents
        )}
        updateConsent={updateConsent}
        isMe={isMe}
      />
    </Flex>
  );
};

export default PhotoConsents;
