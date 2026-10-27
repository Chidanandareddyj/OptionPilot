import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import DeleteAccountSheet from "@/app/(app)/settings/delete-account";
import { SignedOutError } from "@/lib/auth/errors";
import { renderThemed } from "./test-utils";

const mockRouter = { back: jest.fn() };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter }));

const mockDeleteAccount = jest.fn<Promise<{ loginDeleted: boolean }>, []>();
const mockSignOut = jest.fn<Promise<void>, []>();
jest.mock("@/lib/auth", () => ({
  ...jest.requireActual("@/lib/auth/errors"),
  useAuth: () => ({
    user: { id: "u1", email: "asha@example.com", name: "Asha" },
    deleteAccount: mockDeleteAccount,
    signOut: mockSignOut,
  }),
}));

const deleteButton = () => screen.getByRole("button", { name: "Delete account" });

async function typeAndConfirm(phrase = "DELETE") {
  await fireEvent.changeText(screen.getByLabelText("Type DELETE to confirm"), phrase);
  await fireEvent.press(deleteButton());
}

describe("delete account sheet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignOut.mockResolvedValue();
  });

  it("names the account and says it cannot be undone", async () => {
    await renderThemed(<DeleteAccountSheet />);
    expect(screen.getByText("Delete your account?")).toBeOnTheScreen();
    expect(screen.getByText("asha@example.com")).toBeOnTheScreen();
    expect(screen.getByText(/cannot be undone/)).toBeOnTheScreen();
  });

  it("keeps the button disabled until DELETE is typed, and deletes nothing before that", async () => {
    await renderThemed(<DeleteAccountSheet />);
    expect(deleteButton()).toBeDisabled();

    await fireEvent.changeText(screen.getByLabelText("Type DELETE to confirm"), "DELET");
    await fireEvent.press(deleteButton());
    expect(mockDeleteAccount).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByLabelText("Type DELETE to confirm"), "DELETE");
    expect(deleteButton()).toBeEnabled();
  });

  it("Cancel closes the sheet without deleting", async () => {
    await renderThemed(<DeleteAccountSheet />);
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
    expect(mockRouter.back).toHaveBeenCalled();
    expect(mockDeleteAccount).not.toHaveBeenCalled();
  });

  it("deletes once confirmed and leaves the screen to the sign-out", async () => {
    mockDeleteAccount.mockResolvedValue({ loginDeleted: true });
    await renderThemed(<DeleteAccountSheet />);
    await typeAndConfirm();
    await waitFor(() => expect(mockDeleteAccount).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("Could not delete your account")).toBeNull();
    expect(screen.queryByText("Your analyses are deleted")).toBeNull();
  });

  it("says nothing was deleted when the request fails, and lets the person retry", async () => {
    mockDeleteAccount.mockRejectedValueOnce(new Error("500"));
    await renderThemed(<DeleteAccountSheet />);
    await typeAndConfirm();
    expect(await screen.findByText("Could not delete your account")).toBeOnTheScreen();
    expect(screen.getByText(/Nothing was deleted/)).toBeOnTheScreen();

    mockDeleteAccount.mockResolvedValueOnce({ loginDeleted: true });
    await fireEvent.press(deleteButton());
    await waitFor(() => expect(mockDeleteAccount).toHaveBeenCalledTimes(2));
  });

  it("is honest when the analyses are gone but the login remains", async () => {
    mockDeleteAccount.mockResolvedValue({ loginDeleted: false });
    await renderThemed(<DeleteAccountSheet />);
    await typeAndConfirm();

    expect(await screen.findByText("Your analyses are deleted")).toBeOnTheScreen();
    expect(screen.getByText(/could not remove your login/)).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Sign out" }));
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("shows no error when the session ended during the delete (the app is already signing out)", async () => {
    mockDeleteAccount.mockRejectedValue(new SignedOutError());
    await renderThemed(<DeleteAccountSheet />);
    await typeAndConfirm();
    await act(async () => {});
    expect(screen.queryByText("Could not delete your account")).toBeNull();
  });
});
