import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
} from "@mui/material";

import { loginUser } from "../../services/authService";

export default function Login() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const handleLogin = async () => {

    try {

      const response = await loginUser(email, password);

      console.log(response);

      alert(response.message);

      localStorage.setItem(
        "user",
        JSON.stringify(response.data)
      );

      navigate("/dashboard");

    } catch (err) {

      alert(
        err.response?.data?.message ||
        "Login Failed"
      );

    }

  };

  return (

    <Box
      sx={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f7fa",
      }}
    >

      <Paper
        elevation={5}
        sx={{
          width: 420,
          p: 5,
          borderRadius: 3,
        }}
      >

        <Typography
          variant="h4"
          align="center"
          mb={1}
          fontWeight="bold"
        >
          🚆 ERJA
        </Typography>

        <Typography
          align="center"
          color="gray"
          mb={4}
        >
          Emergency Railway Journey Assistant
        </Typography>

        <TextField
          fullWidth
          label="Email"
          margin="normal"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />

        <TextField
          fullWidth
          type="password"
          label="Password"
          margin="normal"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
        />

        <Button
          fullWidth
          variant="contained"
          sx={{ mt:3 }}
          onClick={handleLogin}
        >
          Login
        </Button>

      </Paper>

    </Box>

  );

}