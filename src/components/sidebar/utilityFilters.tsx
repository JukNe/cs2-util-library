import FilterButton from './filterButton';

const UtilityFilters = () => {

    return (
        <div>
            <h4>Utility Filters</h4>
            <FilterButton type='smoke' title={'Smokes'} />
            <FilterButton type='molotov' title={'Molotovs'} />
            <FilterButton type='flash' title={'Flashbangs'} />
            <FilterButton type='he' title={'HE'} />

            <h4>Team Filters</h4>
            <FilterButton type='T' title={'T'} iconType='png' />
            <FilterButton type='CT' title={'CT'} iconType='png' />
        </div>
    )
}

export default UtilityFilters;

