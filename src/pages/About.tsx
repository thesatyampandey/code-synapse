import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code2, Users, Zap, MessageSquare, ArrowLeft, Globe, Shield, Rocket } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background dark flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-border flex items-center px-6">
        <Link to="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-primary shadow-glow">
              <Code2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              About <span className="text-primary">CodeSync</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Empowering developers to collaborate seamlessly in real-time
            </p>
          </div>

          {/* Mission */}
          <Card className="bg-card border-border shadow-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-6 w-6 text-primary" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p className="mb-4">
                CodeSync was built to revolutionize the way developers collaborate. We believe that great code
                is written together, and our platform makes it effortless for teams to code in real-time,
                share ideas, and build amazing projects.
              </p>
              <p>
                Whether you're pair programming, teaching, conducting code reviews, or just jamming with friends,
                CodeSync provides a professional-grade environment powered by the same Monaco editor that drives
                Visual Studio Code.
              </p>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-card border-border hover:border-primary transition-smooth">
              <CardHeader>
                <Code2 className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Professional Editor</CardTitle>
                <CardDescription>
                  Monaco-powered editor with syntax highlighting, IntelliSense, and multi-language support
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border hover:border-primary transition-smooth">
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Real-time Collaboration</CardTitle>
                <CardDescription>
                  See changes instantly as your team codes together with live cursors and updates
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border hover:border-primary transition-smooth">
              <CardHeader>
                <MessageSquare className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Built-in Communication</CardTitle>
                <CardDescription>
                  Chat with your team without leaving the editor. Discuss code and share ideas seamlessly
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border hover:border-primary transition-smooth">
              <CardHeader>
                <Zap className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Instant Compile</CardTitle>
                <CardDescription>
                  Run your code and see output immediately with our integrated compiler panel
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border hover:border-primary transition-smooth">
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Secure & Private</CardTitle>
                <CardDescription>
                  Your code is yours. We prioritize security and privacy in every feature we build
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border hover:border-primary transition-smooth">
              <CardHeader>
                <Globe className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Global Access</CardTitle>
                <CardDescription>
                  Code from anywhere in the world. All you need is a browser and an internet connection
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Technology Stack */}
          <Card className="bg-card border-border shadow-panel">
            <CardHeader>
              <CardTitle>Built with Modern Technology</CardTitle>
              <CardDescription>
                CodeSync leverages cutting-edge web technologies to deliver a seamless experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {['React', 'TypeScript', 'Monaco Editor', 'WebSocket', 'Vite', 'Tailwind CSS'].map((tech) => (
                  <span
                    key={tech}
                    className="px-4 py-2 bg-muted rounded-lg text-sm font-medium text-foreground"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Ready to start coding together?</h2>
            <Link to="/">
              <Button className="bg-gradient-primary hover:opacity-90 text-white shadow-glow">
                Get Started Now
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="h-16 border-t border-border flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Built with ❤️ for collaborative coding
        </p>
      </footer>
    </div>
  );
};

export default About;
