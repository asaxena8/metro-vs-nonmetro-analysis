let data, barChart, lineChart;
let isMetroSelected = null;

const dispatcher = d3.dispatch('stateChange');

d3.csv('data/FinalProjectOutput.csv').then(_data => {
    data = _data.map(d => {
        const numericKeys = ['family_member_count', 'housing_cost',
            'food_cost', 'transportation_cost', 'healthcare_cost',
            'other_necessities_cost', 'childcare_cost', 'taxes',
            'total_cost', 'median_family_income', 'Civilian_labor_force', 'Employed', 'Unemployed',
            'Unemployment_rate'];

        numericKeys.forEach(key => {
            d[key] = d[key] === "NA" ? null : +d[key];
        });

        return d;
    }).filter(d => {
        return !Object.values(d).includes(null);
    });

    const isMetro = [...new Set(data.map(d => d.isMetro))];

    const colorScale = d3.scaleOrdinal().domain(isMetro).range(d3.schemeCategory10);

    barchart = new BarChart({ parentElement: '#barchart' }, data, colorScale, dispatcher);
    barchart.updateVis();

    lineChart = new LineChart({ parentElement: '#linechart' }, data, colorScale, dispatcher);
    lineChart.updateVis();

    choropleth = new ChoroplethChart({ parentElement: '#choroplethchart' }, data, colorScale, dispatcher);
    choropleth.updateVis();
});

d3.select("#filter-button").on("click", function () {
    d3.select("#barchart-placeholder").text("");
    d3.select("#linechart-placeholder").text("");

    barchart.data = data;
    lineChart.data = data;

    barchart.updateVis();
    lineChart.updateVis();
});

d3.selectAll("#metro-toggle, #non-metro-toggle").on("change", function() {
    let metroChecked = d3.select("#metro-toggle").property("checked");
    let nonMetroChecked = d3.select("#non-metro-toggle").property("checked");

    if(metroChecked && nonMetroChecked) {
        isMetroSelected = null;
    } else if(metroChecked) {
        isMetroSelected = true;
    } else if(nonMetroChecked) {
        isMetroSelected = false;
    } else {
        isMetroSelected = null;
    }

    barchart.data = data.filter(d => {
        if(isMetroSelected === null) {
            return true;
        } else {
            if (isMetroSelected) {
                return d.isMetro === "True";
            } else {
                return d.isMetro === "False";
            }
        }
    });

    lineChart.data = data.filter(d => {
        if(isMetroSelected === null) {
            return true;
        } else {
            if (isMetroSelected) {
                return d.isMetro === "True";
            } else {
                return d.isMetro === "False";
            }
        }
    });

    barchart.updateVis();
    lineChart.updateVis();
});



dispatcher.on('stateChange', state => {
    d3.select("#barchart-placeholder").text(` (${state})`);
    d3.select("#linechart-placeholder").text(` (${state})`);

    if (isMetroSelected !== null) {
        if (isMetroSelected) {
            barchart.data = data.filter(d => d.state === state && d.isMetro === "True");
            lineChart.data = data.filter(d => d.state === state && d.isMetro === "True");
        }else {
            barchart.data = data.filter(d => d.state === state && d.isMetro === "False");
            lineChart.data = data.filter(d => d.state === state && d.isMetro === "False");
        }
    } else {
        barchart.data = data.filter(d => d.state === state);
        lineChart.data = data.filter(d => d.state === state);
    }

    barchart.updateVis();
    lineChart.updateVis();
});