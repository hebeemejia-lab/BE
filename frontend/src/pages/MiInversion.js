const MiInversion = () => {
  const [rechartsComponents, setRechartsComponents] = useState(null);

  useEffect(() => {
    (async () => {
      const recharts = await import('recharts');
      setRechartsComponents({
        LineChart: recharts.LineChart,
        Line: recharts.Line,
        BarChart: recharts.BarChart,
        Bar: recharts.Bar,
        PieChart: recharts.PieChart,
        Pie: recharts.Pie,
        Cell: recharts.Cell,
        XAxis: recharts.XAxis,
        YAxis: recharts.YAxis,
        Tooltip: recharts.Tooltip,
        CartesianGrid: recharts.CartesianGrid,
        ResponsiveContainer: recharts.ResponsiveContainer,
        Legend: recharts.Legend
      });
    })();
  }, []);

  const { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } = rechartsComponents;

  return (
    <div>
      <h1>MI Inversion</h1>
      <LineChart width={400} height={300}>
        <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
        <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
      </LineChart>
      <BarChart width={400} height={300}>
        <Bar dataKey="value" stroke="#8884d8" strokeWidth={2} />
        <Bar dataKey="value" stroke="#8884d8" strokeWidth={2} />
      </BarChart>
      <PieChart width={400} height={300}>
        <Pie dataKey="value" stroke="#8884d8" strokeWidth={2} />
        <Pie dataKey="value" stroke="#8884d8" strokeWidth={2} />
      </PieChart>
      <CellChart width={400} height={300}>
        <Cell dataKey="value" stroke="#8884d8" strokeWidth={2} />
        <Cell dataKey="value" stroke="#8884d8" strokeWidth={2} />
      </CellChart>
      <XAxis />
      <YAxis />
      <Tooltip />
      <CartesianGrid />
      <ResponsiveContainer />
      <Legend />
    </div>
  );
};

export default MiInversion;