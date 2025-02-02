

// Function to calculate investment growth
function calculateInvestmentGrowth(P, PMT, r, t) {
    const n = 12; // Compounded monthly
    const monthlyRate = r / 100 / n; // Convert annual rate to monthly rate
    const months = t * n; // Total number of months

    let FV = P; // Start with initial investment
    let noInvestmentFV = P; // Track money without investment
    const data = [];

    for (let i = 1; i <= months; i++) {
        FV = FV * (1 + monthlyRate) + PMT; // Add recurring investment and compound interest
        noInvestmentFV += PMT; // Just add monthly contributions
        data.push({ month: i, value: FV, noInvestment: noInvestmentFV });
    }

    return data;
}

// Function to plot the investment growth
function plotInvestmentGrowth() {
    // Get user inputs
    const P = parseFloat(document.getElementById('initial-investment').value);
    const PMT = parseFloat(document.getElementById('monthly-investment').value);
    const r = parseFloat(document.getElementById('return-rate').value);
    const y = parseFloat(document.getElementById('year-range').value);

    // Calculate investment growth
    const data = calculateInvestmentGrowth(P, PMT, r, y);

    // Extract x and y values for the plot
    const startYear = new Date().getFullYear(); // Get the current year
    const xValues = data.map((d) => startYear + (d.month / 12)); // Convert months to years
    const yValues = data.map((d) => d.value);
    const noInvestmentYValues = data.map((d) => d.noInvestment);

    // Create the plot traces
    const traceInvestment = {
        x: xValues,
        y: yValues,
        type: 'scatter',
        mode: 'lines',
        name: 'Investment Growth'
    };

    const traceNoInvestment = {
        x: xValues,
        y: noInvestmentYValues,
        type: 'scatter',
        mode: 'lines',
        name: 'No Investment Growth',
        line: { dash: 'dot', color: 'red' }
    };

    const layout = {
        title: 'Investment Growth Over Time',
        xaxis: { title: 'Year' },
        yaxis: { title: '$' }
    };

    Plotly.newPlot('graph', [traceInvestment, traceNoInvestment], layout);
}

// Plot the default investment growth on page load
plotInvestmentGrowth();

document.getElementById('initial-investment').addEventListener('input', plotInvestmentGrowth);
document.getElementById('monthly-investment').addEventListener('input', plotInvestmentGrowth);
document.getElementById('return-rate').addEventListener('input', plotInvestmentGrowth);
document.getElementById('year-range').addEventListener('input', plotInvestmentGrowth);