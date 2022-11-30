# What is JavHTML ?

Do you like java ?
Do you like xml ?
Me neither.

That's why I've created your worst possible nightmare (I'm late for Halloween, I know).
You can now write java code in xml syntax !!!

# How does it work ?
Write your code in the `/root` folder, and launch the `run` script.
Your code will be compiled to java in the output directory you desire, or by default `/java_output`.

# Syntax
First of all, you need to create a xml file, with at least one tag inside it.
That tag will be `file` with a `name` attribue :
```xml
<file name="Class">
</file>
```

This will create a file named `Class.java`.
You can now begin writing some classes :
```xml
<file name="Class">
    <class name="Class" visibility="public">
    </class>
</file>
```
Class created, let's add some variables :
```xml
<file name="Class">
    <class name="Class" visibility="public">
        <params>
            <myVariable static="true" type="int">42</myVariable>
        </params>
    </class>
</file>
```
And finally some methods :
```xml
<file name="Class">
    <class name="Class" visibility="public">
        <params>
            <myVariable static="true" type="int">42</myVariable>
        </params>
        <main visibility="public" static="true" type="void">
            <params>
                <args type="String[]" />
            </params>
            <hw type="String">"Hello world"</hw>
            <System.out.println>
                <params>
                    <hw />
                </params>
            </System.out.println>
        </main>
    </class>
</file>
```

# Documentation
## File
```xml
<file name="filename">
    <!-- Your code here -->
</file>
```
### props
- `name` : The name of the file (with or without the extension)

## Class
```xml
<class name="classname" visibility="public">
    <params>
        <!-- Your variables here -->
    </params>
    <!-- Your code here -->
</class>
```
### props
- `name` : The name of the class
- `visibility` : `public` | `private` | `protected` : The visibility of the class
- `extends` : The class that the class extends
- `implements` : The interfaces that the class implements
- `abstract` : `true` if the class is abstract

### children
- `params` : The variables of the class
- others : The methods of the class

## Method definition
```xml
<methodName visibility="public" static="true" type="void">
    <params>
        <!-- method parameters here -->
    </params>
    <!-- Your code here -->
</methodName>
```
### props
- `visibility` : `public` | `private` | `protected` : The visibility of the method
- `static` : `true` if the method is static
- `type` : The return type of the method
- `abstract` : `true` if the method is abstract

### children
- `params` : The parameters of the method
- others : The code of the method

## Variable definition
```xml
<variableName static="true" type="int">42</variableName>
```
### props
- `visibility` : `public` | `private` | `protected` : The visibility of the variable
- `static` : `true` if the variable is static
- `type` : The type of the variable
- `final` : `true` if the variable is final
### innerText
- The value of the variable

## Method call
```xml
<methodName>
    <params>
        <!-- method parameters here -->
    </params>
</methodName>
```
### children
- `params` : The parameters of the method

## Variable call
```xml
<variableName />
```

## Operators
### with non-variable values
```xml
<variableName>5 + 5</variableName>
```
translates to 
```java
variableName = 5 + 5;
```

### with variable values
```xml
<variableName>
    <var1> + </var1>
    <var2/>
</variableName>
```
translates to 
```java
variableName = var1 + var2;
```


# Enjoy :]