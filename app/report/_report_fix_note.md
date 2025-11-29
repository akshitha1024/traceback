Fixes applied:
- Removed " etc..." from the category <select> options (visible option label now matches the value exactly).
- Appended " etc..." to the examples shown in the "Learn more" category modal rows.
- Ensured required attributes remain on all inputs except image and time.

If you want the backend to receive labels including the " etc..." suffix, edit handleSubmit to include the suffix when submitting `custom_category`.
