const stateNames = {
    'AL': 'Alabama',
    'AK': 'Alaska',
    'AZ': 'Arizona',
    'AR': 'Arkansas',
    'CA': 'California',
    'CO': 'Colorado',
    'CT': 'Connecticut',
    'DE': 'Delaware',
    'FL': 'Florida',
    'GA': 'Georgia',
    'HI': 'Hawaii',
    'ID': 'Idaho',
    'IL': 'Illinois',
    'IN': 'Indiana',
    'IA': 'Iowa',
    'KS': 'Kansas',
    'KY': 'Kentucky',
    'LA': 'Louisiana',
    'ME': 'Maine',
    'MD': 'Maryland',
    'MA': 'Massachusetts',
    'MI': 'Michigan',
    'MN': 'Minnesota',
    'MS': 'Mississippi',
    'MO': 'Missouri',
    'MT': 'Montana',
    'NE': 'Nebraska',
    'NV': 'Nevada',
    'NH': 'New Hampshire',
    'NJ': 'New Jersey',
    'NM': 'New Mexico',
    'NY': 'New York',
    'NC': 'North Carolina',
    'ND': 'North Dakota',
    'OH': 'Ohio',
    'OK': 'Oklahoma',
    'OR': 'Oregon',
    'PA': 'Pennsylvania',
    'RI': 'Rhode Island',
    'SC': 'South Carolina',
    'SD': 'South Dakota',
    'TN': 'Tennessee',
    'TX': 'Texas',
    'UT': 'Utah',
    'VT': 'Vermont',
    'VA': 'Virginia',
    'WA': 'Washington',
    'WV': 'West Virginia',
    'WI': 'Wisconsin',
    'WY': 'Wyoming'
};

const stateCodes = {
    'Alabama': 'AL',
    'Alaska': 'AK',
    'Arizona': 'AZ',
    'Arkansas': 'AR',
    'California': 'CA',
    'Colorado': 'CO',
    'Connecticut': 'CT',
    'Delaware': 'DE',
    'Florida': 'FL',
    'Georgia': 'GA',
    'Hawaii': 'HI',
    'Idaho': 'ID',
    'Illinois': 'IL',
    'Indiana': 'IN',
    'Iowa': 'IA',
    'Kansas': 'KS',
    'Kentucky': 'KY',
    'Louisiana': 'LA',
    'Maine': 'ME',
    'Maryland': 'MD',
    'Massachusetts': 'MA',
    'Michigan': 'MI',
    'Minnesota': 'MN',
    'Mississippi': 'MS',
    'Missouri': 'MO',
    'Montana': 'MT',
    'Nebraska': 'NE',
    'Nevada': 'NV',
    'New Hampshire': 'NH',
    'New Jersey': 'NJ',
    'New Mexico': 'NM',
    'New York': 'NY',
    'North Carolina': 'NC',
    'North Dakota': 'ND',
    'Ohio': 'OH',
    'Oklahoma': 'OK',
    'Oregon': 'OR',
    'Pennsylvania': 'PA',
    'Rhode Island': 'RI',
    'South Carolina': 'SC',
    'South Dakota': 'SD',
    'Tennessee': 'TN',
    'Texas': 'TX',
    'Utah': 'UT',
    'Vermont': 'VT',
    'Virginia': 'VA',
    'Washington': 'WA',
    'West Virginia': 'WV',
    'Wisconsin': 'WI',
    'Wyoming': 'WY'
};


class ChoroplethChart {

    /**
     * class constructor with basic chart configuration
     * @param {Object} _config 
     * @param {Array} _data 
     * @param {d3.Scale} _colorScale 
     */
    constructor(_config, _data, _colorScale, _dispatcher) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 600,
            containerHeight: _config.containerHeight || 220,
            margin: _config.margin || { top: 5, right: 5, bottom: 20, left: 100 }
        };
        this.data = _data;
        this.colorScale = _colorScale;
        this.dispatcher = _dispatcher || null;
        this.series = [];

        this.initVis();
    }

    /**
     * this function is used to initialize scales/axes and append static elements
     */
    initVis() {
        let vis = this;

        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        vis.svg = d3.select(vis.config.parentElement)
            .append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);
    }

    /**
     * this function is used to prepare the data and update the scales before we render the actual vis
     */
    updateVis() {
        let vis = this;

        vis.renderVis();
    }

    /**
     * this function contains the d3 code for binding data to visual elements
     */
    renderVis() {
        let vis = this;

        // Load the US state data
        let mapCoordinateData = d3.json('data/USAMap.json');

        Promise.all([mapCoordinateData]).then(function (data) {

            let stateTaxes = new Map();
            vis.data.forEach(d => {
                let state = stateNames[d.state];
                let tax = d.taxes;
                stateTaxes.set(state, (stateTaxes.get(state) || 0) + tax);
            });

            let projection = d3.geoEquirectangular();
            projection.fitSize([vis.width * 4, vis.height * 5], data[0]);

            let generator = d3.geoPath().projection(projection);

            let color = [
                d3.scaleSequential()
                    .domain([1, 10000000])
                    .interpolator(d3.interpolateBlues),
            ];

            let svg = d3.select("#mapSVG")
                .attr('transform', 'translate(10, -300)');

            let plot = svg.append("g")
                .attr('transform', 'translate(0,0)');

            plot.selectAll('paths')
                .data(data[0].features)
                .enter()
                .append('path')
                .attr('d', generator)
                .attr('stroke', 'black')
                .attr('opacity', 0.9)
                .style("fill", (d) => {
                    return color[0](stateTaxes.get(d.properties.NAME))
                })
                .attr('stroke-width', 1)
                .on('click', function (e) {
                    vis.dispatcher.call('stateChange', this, stateCodes[e.currentTarget.__data__.properties.NAME]);
                });;

            plot.selectAll('text')
                .data(data[0].features)
                .enter()
                .append('text')
                .attr('transform', function (d) {
                    let centroid = generator.centroid(d);
                    return `translate(${centroid[0]}, ${centroid[1]})`;
                })
                .text(function (d) {
                    return stateCodes[d.properties.NAME];
                })
                .attr('font-size', '8px')
                .attr('text-anchor', 'middle');

            let groupedData = d3.group(vis.data, d => stateNames[d.state], d => d.isMetro);

            let stateTaxesBreakup = new Map(
                Array.from(groupedData, ([state, metroData]) => [
                    state,
                    {
                        metro: d3.sum(Array.from(metroData.get('True') || [], d => d.taxes)),
                        nonMetro: d3.sum(Array.from(metroData.get('False') || [], d => d.taxes))
                    }
                ])
            );

            let temp = Array.from(groupedData, ([state, metroData]) => [
                state,
                {
                    metro: d3.sum(Array.from(metroData.get('True') || [], d => d.taxes)),
                    nonMetro: d3.sum(Array.from(metroData.get('False') || [], d => d.taxes))
                }
            ])


            let pie = d3.pie().value(d => d[1]);

            let colorScale = d3.scaleOrdinal()
                .domain(['metro', 'nonMetro'])
                .range(['#e7585b', '#f78e39']);

            let radiusScale = d3.scaleLinear()
                .domain([d3.min(temp, d => {
                    return d[1].metro + d[1].nonMetro
                }), d3.max(temp, d => d[1].metro + d[1].nonMetro)])
                .range([5, 20]);


            plot.selectAll('.pie-chart')
                .data(data[0].features)
                .enter()
                .append('g')
                .attr('class', 'pie-chart')
                .attr('transform', function (d) {
                    let centroid = generator.centroid(d);
                    return `translate(${centroid[0]}, ${centroid[1]})`;
                })
                .each(function (d) {
                    let pieData = pie(Object.entries(stateTaxesBreakup.get(d.properties.NAME) || {}));
                    let radius;
                    if (pieData.length >= 2) {
                        radius = pieData[0].data[1] + pieData[1].data[1];
                    } 
                    d3.select(this).selectAll('path')
                        .data(pieData)
                        .enter()
                        .append('path')
                        .attr('d', d3.arc().innerRadius(0).outerRadius(d => {
                            return 8;
                            return radiusScale(radius);
                        }))
                        .attr('fill', (d) => {
                            return colorScale(d.data[0])
                        });
                });
        });


    }
}