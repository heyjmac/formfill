import React, { useEffect, useState } from 'react';
import { events } from '../../ai-components/utils/events';

export const EvalsIframe = React.memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [previousUrl, setPreviousUrl] = useState('');
  const [url, setUrl] = useState('');

  useEffect(() => {
    const unsubscribe = events.on('evals:iframe', ({ url }) => {
      setUrl(url);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (previousUrl !== url) {
      setPreviousUrl(url);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [previousUrl, url]);

  return <iframe className={`transition-all ${isOpen ? 'w-1/2' : 'w-0'}`} src={url} />;
});
