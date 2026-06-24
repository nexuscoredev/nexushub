import {
  DRINK_CARTA_VIEW_OPTIONS,
  getDrinkCartaViewOption,
  type DrinkCartaViewMode,
} from '../../lib/drinkCartaView';
import { PersonalViewMenu } from './PersonalViewMenu';

type DrinkCartaViewMenuProps = {
  viewMode: DrinkCartaViewMode;
  onViewModeChange: (mode: DrinkCartaViewMode) => void;
};

export function DrinkCartaViewMenu({ viewMode, onViewModeChange }: DrinkCartaViewMenuProps) {
  const active = getDrinkCartaViewOption(viewMode);

  return (
    <PersonalViewMenu
      viewMode={viewMode}
      options={DRINK_CARTA_VIEW_OPTIONS}
      activeLabel={active.label}
      onViewModeChange={onViewModeChange}
    />
  );
}
