"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../../services/api";
import Navbar from "../../components/Navbar";
import "./PollsPage.css";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  id: string;
  username: string;
  role: string;
  exp: number;
}

const PollItem = ({ poll, user, onDelete }) => {
  const isAdmin = user?.role === "admin";

  const deletePoll = async (pollId) => {
    if (window.confirm("Are you sure you want to delete this poll?")) {
      try {
        const response = await fetch(`/api/polls/${pollId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (response.ok) {
          alert("Poll deleted successfully.");
          onDelete(pollId); // Update UI after delete
        } else {
          const data = await response.json();
          alert(data.message || "Failed to delete poll.");
        }
      } catch (error) {
        console.error("Error deleting poll:", error);
        alert("An error occurred.");
      }
    }
  };

  return (
    <div className="poll-item">
      <h3>{poll.title}</h3>
      {poll.options.map((option, index) => (
        <p key={index}>
          {option.text}: {option.votes} votes
        </p>
      ))}
      {poll.expiryDate && (
        <p>Expires on: {new Date(poll.expiryDate).toLocaleString()}</p>
      )}
      {isAdmin && (
        <button onClick={() => deletePoll(poll._id)} className="delete-button">
          Delete
        </button>
      )}
    </div>
  );
};

export default function PollsPage() {
  const [polls, setPolls] = useState([]);
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [expiryDate, setExpiryDate] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded: DecodedToken = jwtDecode(token);
        const currentTime = Math.floor(Date.now() / 1000);

        if (decoded.exp < currentTime) {
          localStorage.removeItem("token");
          router.push("/login");
        } else {
          api.fetchUserDetails(decoded.id)
            .then((userData) => setUser({ ...userData, token }))
            .catch((err) => {
              console.error(err);
              router.push("/login");
            });
        }
      } catch (error) {
        localStorage.removeItem("token");
        router.push("/login");
      }
    } else {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const data = await api.getPolls();
        const now = new Date();

        const activePolls = data.filter((poll) => {
          if (poll.expiryDate) {
            return new Date(poll.expiryDate) > now;
          }
          return true;
        });

        setPolls(activePolls);
      } catch (err) {
        setError("Failed to load polls");
      }
    };
    fetchPolls();
  }, []);

  const handleCreatePoll = async () => {
    try {
      if (!title || options.some((option) => !option.trim())) {
        alert("Title and all options are required.");
        return;
      }

      await api.createPoll({ title, options, expiryDate });
      setTitle("");
      setOptions(["", ""]);
      setExpiryDate("");
      const data = await api.getPolls();
      setPolls(data);
    } catch (err) {
      setError("Failed to create poll");
    }
  };

  const handleVote = async (pollId, optionIndex) => {
    try {
      await api.votePoll(pollId, optionIndex);
      const data = await api.getPolls();
      setPolls(data);
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        "You have already voted on this poll or an error occurred.";
      setError(errorMessage);
    }
  };

  const handleDeletePoll = (pollId) => {
    setPolls((prevPolls) => prevPolls.filter((poll) => poll._id !== pollId));
  };

  return (
    <>
      <Navbar
        currentPath="/polls"
        currentUsername={user?.username || ""}
        currentEmail={user?.email || ""}
      />
      <div className="polls-container">
        <h1 className="title">Polls</h1>

        <div className="create-poll">
          <h2>Create Poll</h2>
          <input
            type="text"
            placeholder="Poll title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
          />
          {options.map((option, index) => (
            <div key={index} className="option">
              <input
                type="text"
                placeholder={`Option ${index + 1}`}
                value={option}
                onChange={(e) =>
                  setOptions(
                    options.map((opt, i) => (i === index ? e.target.value : opt))
                  )
                }
                className="input"
              />
              {options.length > 2 && (
                <button
                  onClick={() =>
                    setOptions(options.filter((_, i) => i !== index))
                  }
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button onClick={() => setOptions([...options, ""])}>Add Option</button>
          <input
            type="datetime-local"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="input"
            placeholder="Expiry Date"
          />
          <button onClick={handleCreatePoll} className="button">
            Create Poll
          </button>
        </div>

        <div className="polls-list">
          <h2>Existing Polls</h2>
          {polls.length === 0 ? (
            <p>No active polls available.</p>
          ) : (
            polls.map((poll) => (
              <PollItem
                key={poll._id}
                poll={poll}
                user={user}
                onDelete={handleDeletePoll}
              />
            ))
          )}
        </div>

        {error && <p className="error">{error}</p>}
      </div>
    </>
  );
}
