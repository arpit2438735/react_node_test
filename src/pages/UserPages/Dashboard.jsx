import React, { useEffect, useState, useRef } from "react";
import { DndContext, closestCorners } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import UserSidebar from "./UserSidebar";
import Column from "./Column";
import SortableItem from "./SortableItem";
import notificationSound from "./notification.mp3";

const UserDashboard = () => {
  const { user } = useAuth();
  const isAuthenticated = !!user || !!localStorage.getItem("token");
  
  const [tasks, setTasks] = useState({
    "To Do": [],
    "In Progress": [],
    Completed: [],
  });

  // Filter state - all categories visible by default
  const [visibleCategories, setVisibleCategories] = useState({
    "To Do": true,
    "In Progress": true,
    Completed: true,
  });

  const [notes, setNotes] = useState(localStorage.getItem("notes") || "");
  const audioRef = useRef(new Audio(notificationSound));

  // 🔹 Ensure page starts from top when component loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const storedTasks = JSON.parse(localStorage.getItem("tasks")) || [];
    const categorizedTasks = {
      "To Do": storedTasks.filter((task) => task.progress <= 40),
      "In Progress": storedTasks.filter((task) => task.progress > 40 && task.progress <= 80),
      Completed: storedTasks.filter((task) => task.progress > 80),
    };
    setTasks(categorizedTasks);
    checkDeadlines(storedTasks);
  }, []);

  useEffect(() => {
    localStorage.setItem("notes", notes);
  }, [notes]);

  const checkDeadlines = (tasks) => {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    tasks.forEach((task) => {
      if (task.deadline === today) {
        showNotification(`🚨 Task Due Today: "${task.title}"`, "bg-red-500 text-white");
      } else if (task.deadline === tomorrowStr) {
        showNotification(`⏳ Task Due Tomorrow: "${task.title}"`, "bg-yellow-500 text-black");
      }
    });
  };

  const showNotification = (message, bgClass) => {
    toast(
      <div className={`p-2 rounded-lg shadow-md font-semibold text-lg ${bgClass}`}>
        {message}
      </div>,
      { position: "top-right", autoClose: 5000, hideProgressBar: false }
    );
    audioRef.current.play();
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sourceColumn = Object.keys(tasks).find((column) =>
      tasks[column].some((task) => task.id === active.id)
    );
    const targetColumn = Object.keys(tasks).find((column) => tasks[column].some((task) => task.id === over.id)) || over.id;

    if (!sourceColumn || !targetColumn || sourceColumn === targetColumn) return;

    setTasks((prevTasks) => {
      const updatedTasks = { ...prevTasks };
      const movedTask = updatedTasks[sourceColumn].find((task) => task.id === active.id);
      updatedTasks[sourceColumn] = updatedTasks[sourceColumn].filter((task) => task.id !== active.id);
      updatedTasks[targetColumn] = [...(updatedTasks[targetColumn] || []), movedTask];

      return updatedTasks;
    });

    localStorage.setItem("tasks", JSON.stringify([...tasks["To Do"], ...tasks["In Progress"], ...tasks["Completed"]]));
  };

  // Task Analytics Chart Data (Bar Graph) - filtered by visible categories
  const visibleCategoryKeys = Object.keys(tasks).filter(key => visibleCategories[key]);
  const chartData = {
    labels: visibleCategoryKeys,
    datasets: [
      {
        label: "Number of Tasks",
        data: visibleCategoryKeys.map(key => tasks[key].length),
        backgroundColor: visibleCategoryKeys.map(key => {
          const colors = {
            "To Do": "#FF6384",
            "In Progress": "#FFCE56",
            "Completed": "#36A2EB"
          };
          return colors[key];
        }),
      },
    ],
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 to-gray-100">
      <UserSidebar />

      <div className="flex-1 p-6">
        <h2 className="text-4xl font-bold text-gray-900 mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
          🚀 User Dashboard
        </h2>
        
        {/* Login Suggestion Message for Unauthenticated Users */}
        {!isAuthenticated && (
          <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-700 p-4 mb-6 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">
                  You're viewing this dashboard as a guest. 
                  <Link to="/login" className="ml-2 underline font-semibold hover:text-blue-800">
                    Login
                  </Link> to access all features and save your tasks!
                </p>
              </div>
            </div>
          </div>
        )}
        
        <ToastContainer position="top-right" autoClose={5000} hideProgressBar />

        {/* Task Filter Controls */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Filter Tasks by Status:</h3>
          <div className="flex flex-wrap gap-4 mb-4">
            {Object.keys(tasks).map((category) => (
              <label key={category} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleCategories[category]}
                  onChange={(e) => {
                    setVisibleCategories({
                      ...visibleCategories,
                      [category]: e.target.checked,
                    });
                  }}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="ml-2 text-gray-700 font-medium">
                  {category} ({tasks[category].length})
                </span>
              </label>
            ))}
          </div>
          
          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
            <button
              onClick={() => setVisibleCategories({ "To Do": true, "In Progress": true, "Completed": true })}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Show All
            </button>
            <button
              onClick={() => setVisibleCategories({ "To Do": false, "In Progress": false, "Completed": true })}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition"
            >
              Show Completed Only
            </button>
            <button
              onClick={() => setVisibleCategories({ "To Do": true, "In Progress": true, "Completed": false })}
              className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
            >
              Show Incomplete Only
            </button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="glassmorphism p-4 rounded-xl shadow-lg bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-lg border border-white/20">
          <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.keys(tasks)
                .filter((columnKey) => visibleCategories[columnKey])
                .map((columnKey) => (
                  <Column key={columnKey} title={columnKey} id={columnKey} className="w-[280px]">
                    <SortableContext items={tasks[columnKey].map((task) => task.id)} strategy={verticalListSortingStrategy}>
                      {tasks[columnKey].map((task) => (
                        <SortableItem key={task.id} id={task.id} task={task} />
                      ))}
                    </SortableContext>
                  </Column>
                ))}
            </div>
            {/* Show message when no columns are visible */}
            {Object.values(visibleCategories).every((visible) => !visible) && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg">No task categories selected. Please select at least one category to view tasks.</p>
              </div>
            )}
          </DndContext>
        </div>

        {/* Task Analytics & Notes Section */}
        <div className="mt-10 flex flex-col lg:flex-row items-start gap-6">
          {/* Task Analytics Chart */}
          <div className="p-6 w-full lg:w-1/2 bg-white shadow-lg rounded-xl border border-gray-300">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4 text-center tracking-wide uppercase">
              📊 Task Analytics
            </h2>
            <Bar data={chartData} />
          </div>

          {/* Notes */}
          <div className="p-6 w-full lg:w-[590px] bg-green-900 text-white rounded-xl border-[12px] border-[#8B4501] shadow-lg flex flex-col">
            <h2 className="text-2xl font-bold text-yellow-400 mb-2 text-center">📌 Notes</h2>

            {/* Notes Input Field - Enlarged to match Task Analytics */}
            <textarea
              className="flex-1 bg-transparent border-none outline-none text-white text-lg p-7"
              placeholder="Write your notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              autoFocus
              style={{
                fontFamily: "Chalkduster, Comic Sans MS, cursive",
                height: "320px",
                minHeight: "280px",
                textAlign: "left",
                resize: "none",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
