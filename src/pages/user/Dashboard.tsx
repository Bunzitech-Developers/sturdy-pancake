import { useEffect, useState } from "react";
import { FaComments, FaImage, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router";
import { useAuthStore } from "../../store/useAuthStore";
import { useDashboardStore } from "../../store/useDashboardStore";
import { useChatStore } from "../../store/useChatStore";
import { Filter } from "bad-words";
import { toast } from "sonner";
import UserProfileDetail from "./UserProfileDetail"; // Import UserProfileDetail

const filter = new Filter();

interface User {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  lookingFor: string;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const { users, isLoading, fetchUsers, requestPhotoAccess } =
    useDashboardStore();
  const { sendMessage } = useChatStore(); // Destructure sendMessage
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserIdForProfile, setSelectedUserIdForProfile] = useState<
    string | null
  >(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchUsers(user.gender);
    }
  }, [user, fetchUsers]);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error("Message cannot be empty");
      return;
    }
    if (!selectedUser) {
      toast.error("No user selected to send message to.");
      return;
    }
    if (!user?.id) {
      // Ensure current user's ID is available
      toast.error("Your user ID is not available. Please log in again.");
      return;
    }

    const cleanedMessage = filter.clean(message);

    // Pass the current user's ID as senderId
    await sendMessage(user.id, selectedUser.id, cleanedMessage); // Modified call

    toast.success(`Message sent to ${selectedUser.firstName}. Opening chat.`);
    setMessage("");
    setIsMessageModalOpen(false);

    navigate(`/chats?userId=${selectedUser.id}`);
  };

  const handleRequestPhoto = async (targetUserId: string) => {
    await requestPhotoAccess(targetUserId);
  };

  const openProfileModal = (userId: string) => {
    setSelectedUserIdForProfile(userId);
    setIsProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
    setSelectedUserIdForProfile(null);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg animate-fadeIn">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Find Matches</h2>
      {isLoading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-rose-600 text-white">
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Age</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => openProfileModal(u.id)}
                  className="border-b hover:bg-rose-50 transition-all duration-300 cursor-pointer"
                >
                  <td className="p-3">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="p-3">{u.age}</td>
                  <td
                    className="p-3 flex gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        setSelectedUser(u);
                        setIsMessageModalOpen(true);
                      }}
                      className="p-2 rounded-full bg-rose-600 text-white hover:bg-rose-700 hover:scale-110 transition-all duration-300"
                      title="Message"
                    >
                      <FaComments className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleRequestPhoto(u.id)}
                      className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 hover:scale-110 transition-all duration-300"
                      title="Request Photos"
                    >
                      <FaImage className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Message Modal */}
      {isMessageModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center animate-fadeIn z-40">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">
              Send Message to {selectedUser?.firstName}
            </h3>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
              placeholder="Type your message..."
              rows={4}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setIsMessageModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-all"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Detail Modal */}
      {isProfileModalOpen && selectedUserIdForProfile && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeProfileModal}
          ></div>
          <div className="fixed inset-y-0 left-0 w-[80%] h-full bg-white shadow-xl transform transition-transform duration-300 ease-out translate-x-0 mx-auto">
            <div className="p-6 h-full overflow-y-auto">
              <button
                onClick={closeProfileModal}
                className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-2xl"
              >
                <FaTimes />
              </button>
              <UserProfileDetail
                userId={selectedUserIdForProfile}
                onClose={closeProfileModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
