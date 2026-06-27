import {
  COFFEE_CARTA_VIEW_OPTIONS,
  getCoffeeCartaViewOption,
  type CoffeeCartaViewMode,
} from '../../lib/coffeeCartaView';
import { PersonalViewMenu } from './PersonalViewMenu';

type CoffeeCartaViewMenuProps = {
  viewMode: CoffeeCartaViewMode;
  onViewModeChange: (mode: CoffeeCartaViewMode) => void;
};

export function CoffeeCartaViewMenu({ viewMode, onViewModeChange }: CoffeeCartaViewMenuProps) {
  const active = getCoffeeCartaViewOption(viewMode);

  return (
    <PersonalViewMenu
      viewMode={viewMode}
      options={COFFEE_CARTA_VIEW_OPTIONS}
      activeLabel={active.label}
      onViewModeChange={onViewModeChange}
    />
  );
}
