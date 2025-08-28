import React, { useEffect, useState } from 'react';
import { events } from '../../ai-components/utils/events';

export const EvalsIframe = React.memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');

  useEffect(() => {
    const unsubscribe = events.on('evals:iframe', ({ url }) => {
      setUrl(url);
      setIsOpen(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return <iframe className={`transition-all ${isOpen ? 'w-1/2' : 'w-0'}`} src={url} />;
});
