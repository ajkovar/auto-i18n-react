import { useTranslation } from 'react-i18next';
import React from 'react';

const Comp = () => {
  var t = useTranslation();
  return (
    <div>
      {t('hello there,')}
      <span>{t('friend')}</span>
    </div>
  );
};

export default Comp;
