import React from 'react';
import { useParams } from 'react-router-dom';

export function SettingsPage(): React.ReactElement {
  const { tab } = useParams<{ tab: string }>();

  return (
    <div data-testid="settings-page">
      <h1 className="text-xl font-semibold">Settings</h1>
      <p className="text-neutral-400">
        Tab:
        {tab ?? 'general'}
      </p>
    </div>
  );
}

export default SettingsPage;
