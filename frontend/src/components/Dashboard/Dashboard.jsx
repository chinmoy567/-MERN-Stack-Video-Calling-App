import Layout from "../Layouts/Layout/Layout";
import socketInstance from "../../socket";

const Dashboard = () => {
  const socket = socketInstance.getSocket();
  console.log(socket);
  return (
    <Layout>
      <h2 className="text-xl text-gray-700 bg-white p-4 rounded shadow">
        Welcome to Dashboard
      </h2>
    </Layout>
  );
};

export default Dashboard;

