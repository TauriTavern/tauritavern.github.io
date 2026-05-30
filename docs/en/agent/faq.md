---
description: Common questions about TauriTavern Agent.
---

# FAQ

<span id="agent-profile-model-from-api-connection"></span>

## How do I use a model saved in API Connection Settings from an Agent Profile?

An Agent Profile does not store API keys or one-off model input directly. It references a model configuration that you have already saved in `API Connection Settings`.

Use this order:

1. Open `API Connection Settings`.
2. Add or select a usable model, then save it. Make sure to choose `Save model only`.
3. Open the `Agent System` panel.
4. Open the Agent Profile you want to use.
5. In the model binding area, choose `Bind model connection` or the equivalent option.
6. Select the model you saved.
7. Save the Agent Profile.
8. Return to the Agent panel and confirm that `Active Profile` is the profile you want to run.

If an imported Profile says it `requires configuration`, it usually is not broken. Exported Profiles do not carry someone else's local model connection. Re-select a model on your machine and save the Profile.

If the model does not appear in the Agent Profile picker, check these points first:

- `API Connection Settings` was saved, rather than only filled in.
- The model uses a chat-completion path supported by the current Agent system.
- You reopened or refreshed the Agent configuration panel after saving the model.
- The Profile you are editing has been saved.

If you only want Agent to use the same model as the current chat, keep `Current prompt snapshot`. You only need to bind a model in the Profile when you want that Agent to use a specific saved model.
