import Layout from "../Layouts/Layout/Layout";
import socketInstance from "../../socket";

const Dashboard = () => {
  const socket = socketInstance.getSocket();
console.log(socket);
  return (
    <Layout>
      <p className="text-gray-700">
        Lorem ipsum dolor sit amet, consectetur adipisicing elit.
      </p>
    </Layout>
  );
};

export default Dashboard;
