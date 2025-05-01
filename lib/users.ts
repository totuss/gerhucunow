import type { User } from "./types"

// Mock database - in a real app, this would be a database connection
const users: User[] = [
  { username: "qkz", password: "1", daysLeft: 30, isAdmin: true },
  { username: "zlepki", password: "0", daysLeft: 15, isAdmin: false },
  { username: "test", password: "1", daysLeft: 0, isAdmin: false },
]

// Function to get all users
export async function getUsers(): Promise<User[]> {
  // In a real app, this would fetch from a database
  return [...users]
}

// Function to get a single user by username
export async function getUserByUsername(username: string): Promise<User | null> {
  return users.find((user) => user.username === username) || null
}

// Function to get all users
export async function getAllUsers(): Promise<User[]> {
  return [...users]
}

// Function to add a new user
export async function addUser(user: User): Promise<void> {
  // Check if user already exists
  const existingUser = await getUserByUsername(user.username)
  if (existingUser) {
    throw new Error(`User with username ${user.username} already exists`)
  }

  // Add user
  users.push(user)
}

// Function to update a user
export async function updateUser(username: string, updatedFields: Partial<User>): Promise<void> {
  const userIndex = users.findIndex((user) => user.username === username)

  if (userIndex === -1) {
    throw new Error(`User with username ${username} not found`)
  }

  // Update user
  users[userIndex] = {
    ...users[userIndex],
    ...updatedFields,
    // If username is being updated, make sure it's unique
    ...(updatedFields.username && updatedFields.username !== username ? { username: updatedFields.username } : {}),
  }
}

// Function to delete a user
export async function deleteUser(username: string): Promise<void> {
  const userIndex = users.findIndex((user) => user.username === username)

  if (userIndex === -1) {
    throw new Error(`User with username ${username} not found`)
  }

  // Delete user
  users.splice(userIndex, 1)
}
