import {
  COFFEE_STOCK_VIEW_OPTIONS,
  getCoffeeStockViewOption,
  type CoffeeStockViewMode,
} from '../../lib/coffeeStockView';
import { PersonalViewMenu } from './PersonalViewMenu';

type CoffeeStockViewMenuProps = {
  viewMode: CoffeeStockViewMode;
  onViewModeChange: (mode: CoffeeStockViewMode) => void;
};

export function CoffeeStockViewMenu({ viewMode, onViewModeChange }: CoffeeStockViewMenuProps) {
  const active = getCoffeeStockViewOption(viewMode);

  return (
    <PersonalViewMenu
      viewMode={viewMode}
      options={COFFEE_STOCK_VIEW_OPTIONS}
      activeLabel={active.label}
      onViewModeChange={onViewModeChange}
    />
  );
}
