import FilterButton from './filterButton';

const UtilityFilters = () => {

    return (
        <div className="utility-filters-container">
            <h4>Utility Filters</h4>
            <div className="filter-buttons-group">
                <FilterButton type='smoke' title={'Smokes'} />
                <FilterButton type='molotov' title={'Molotovs'} />
                <FilterButton type='flash' title={'Flashbangs'} />
                <FilterButton type='he' title={'HE'} />
            </div>

            <h4>Team Filters</h4>
            <div className="filter-buttons-group">
                <FilterButton type='T' title={'T'} iconType='png' />
                <FilterButton type='CT' title={'CT'} iconType='png' />
            </div>
        </div>
    )
}

export default UtilityFilters;

