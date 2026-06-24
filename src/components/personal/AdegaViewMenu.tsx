import {
  ADEGA_VIEW_OPTIONS,
  getAdegaViewOption,
  type AdegaViewMode,
} from '../../lib/adegaView';
import { PersonalViewMenu } from './PersonalViewMenu';

type AdegaViewMenuProps = {
  viewMode: AdegaViewMode;
  onViewModeChange: (mode: AdegaViewMode) => void;
};

export function AdegaViewMenu({ viewMode, onViewModeChange }: AdegaViewMenuProps) {
  const active = getAdegaViewOption(viewMode);

  return (
    <PersonalViewMenu
      viewMode={viewMode}
      options={ADEGA_VIEW_OPTIONS}
      activeLabel={active.label}
      onViewModeChange={onViewModeChange}
    />
  );
}
